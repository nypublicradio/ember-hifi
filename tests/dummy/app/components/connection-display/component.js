import { bool } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { getMimeType } from 'ember-hifi/utils/mime-types';
import { get, set, getWithDefault } from '@ember/object';
import deepSet from 'ember-deep-set';

export default Component.extend({
  layout,
  hifi: service(),
  hifiCache: service(),
  classNames: ['connection-display'],
  classNameBindings:['lastResultWasOurs', 'lastResultCouldHaveBeenOurs'],

  enabled: true,

  //eslint-disable-next-line
  lastResultWasOurs: computed('lastResult.connectionResult', 'lastResult.thisConnection', function() {
    return get(this, 'lastResult') && get(this, 'lastResult.connectionResult') === get(this, 'lastResult.thisConnection');
  }),
  lastResultCouldHaveBeenOurs: bool('lastResult.canPlay'),
  hasLastResult: bool('lastResult'),

  init() {
    this.set('lastResult', null);
    this.set('connectionName', this.connection.toString());

    this._setupLoadRequestMonitor();
    this._setupCanPlayMonitor();
    this._super(...arguments);
  },

  _setupCanPlayMonitor() {
    this.set('canUseConnection', this.connection.canUseConnection());

    let _canPlay = this.connection.canPlay;
    this.connection.canPlay = (url) => {
      if (!this.enabled) {
        return false; // we've disabled it in the diagnostic
      }
      return _canPlay.call(this.connection, url)
    }
  },

  _setupLoadRequestMonitor() {
    // Intercept load requests and push the results into the created sound. This powers the "strategy"
    // area of the debug information in the sound diagnostic

    this.hifi.on('new-load-request', async ({loadPromise, urlsOrPromise, options}) => {
      // TODO: change this event to provide the urls
      let urlsToTry = await this.hifi._resolveUrls(urlsOrPromise)

      let strategies = [];

      if (options.useConnections) {
        // If the consumer has specified a connection to prefer, use it
        let connectionNames  = options.useConnections;
        strategies = this.hifi._prepareStrategies(urlsToTry, connectionNames);
      }
      else if (this.hifi.get('isMobileDevice')) {
        // If we're on a mobile device, we want to try NativeAudio first
        strategies  = this.hifi._prepareMobileStrategies(urlsToTry);
      }
      else {
        strategies  = this.hifi._prepareStandardStrategies(urlsToTry);
      }

      let url = urlsToTry[0];

      let mimeType = typeof(url) === 'string' ?  getMimeType(url) : url.mimeType;

      let result = {
        url,
        title: get(options, 'metadata.title'),
        canPlay: this.connection.canPlay(url),
        mimeType: mimeType,
        canPlayMimeType: this.connection.canPlayMimeType(mimeType),
        canUseConnection: this.connection.canUseConnection(url),
        connectionName: this.connection.toString(),
      }

      loadPromise.then(({sound}) => {
        let results = getWithDefault(sound, 'metadata.debug.results', [])

        set(result, 'thisConnection',  this.connection.toString())
        set(result, 'connectionResult',  sound.connectionName)
        set(this, 'lastResult', result);
        set(result, 'didPlay', this.connection.toString() === sound.connectionName);
        results.push(result);

        let sortedResults = results.sort(result => {
          return strategies.indexOf(s => s.connectionName === result.connectionName)
        }).reverse();

        let triedToPlay = true
        let debugResults = sortedResults.map(result => {
          result.triedToPlay = triedToPlay

          if (result.didPlay) {
            triedToPlay = false
          }

          return result
        });

        deepSet(sound, 'metadata.debug.results', debugResults)
        deepSet(sound, 'metadata.debug.strategies', strategies);
      })
    })
  }
});
