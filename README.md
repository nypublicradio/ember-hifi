# ember-hifi

## The easy way to play audio in your ember app

![Download count all time](https://img.shields.io/npm/dt/ember-hifi.svg) [![npm version](https://img.shields.io/npm/v/ember-hifi.svg?style=flat-square)](https://www.npmjs.com/package/ember-hifi) [![CircleCI](https://img.shields.io/circleci/project/github/nypublicradio/ember-hifi/master.svg?style=flat-square)](https://circleci.com/gh/nypublicradio/ember-hifi/tree/master) [![Ember Observer Score](http://emberobserver.com/badges/ember-hifi.svg)](http://emberobserver.com/addons/ember-hifi)

This addon exposes a `hifi` service which produces `Sound` objects which represent a playable piece of audio.

The `hifi` service makes it easy to play audio in the unfriendly landscape that is the current state of audio on the web. Forget worrying about formats and browsers and just give `hifi` a list of URLs to try and it'll play the first one that works.

## Installing The Addon

```shell
ember install ember-hifi
```

## Usage


### API

#### Service API
`hifi` plays one sound at a time. Multiple sounds can be loaded and ready to go, but only one sound plays at a time. The currently playing sound is set to `currentSound` on the service, and most methods and properties on the service simply proxy to that sound.

###### Methods

- `play(urlsOrPromise, options)`

`play` calls `load` with the same arguments, and then on success plays the sound, returning it to you.

`play` can take one or more URLs, or a promise returning one or more URLs.

If the audio URLs are not known at the time of a play event, give `play` the promise to resolve, otherwise your mobile users might have to click the play button twice (due to some restrictions on autoplaying audio).

```javascript
export default Ember.Route.extend({
  hifi: Ember.inject.service(),
  ...
  actions: {
    play(id) {
      let urlPromise = this.store.find('story', id).then(story => story.getProperties('aacUrl', 'hlsUrl'))

      this.get('hifi').play(urlPromise).then(({sound}) => {
        // sound object

      }).catch(error => {

      })
    }
  }
});
```
If you already know the URLs, just pass them in.

```javascript
export default Ember.Route.extend({
  hifi: Ember.inject.service(),
  ...
  actions: {
    play(urls) {
      this.get('hifi').play(urls).then(({sound}) => {
        // sound object

      }).catch(error => {

      })
    }
  }
});
```

- `pause()`
Pauses the current sound

- `togglePause()`
Toggles the play state of the current sound

- `fastForward(duration)`
Moves the playhead of the current sound forwards by duration (in ms)

- `rewind(duration)`
Moves the playhead of the current sound backwards by duration (in ms)

- `load(urlsOrPromise, options)`
Tries each hifi connection with each url and returns the ready `sound` from the first combination that works. The sound is cached internally so on subsequent load requests with the same url the already prepared sound will be returned. Calling `play` on the returned sound will start playback immediately.

###### Gettable/Settable Properties
- `volume`          (integer, 0-100)

System volume. Bind a range element to this property for a simple volume control
```javascript

//component.js
export default Component.extend({
  hifi: Ember.inject.service(),
})

//template.hbs
{{input type="range" value=hifi.volume}}
```

- `position`        (integer, in ms)

Here's a silly way to make a position control, too.
```javascript
//component.js
export default Component.extend({
  hifi: Ember.inject.service(),
})

//template.hbs
{{input type="range" value=hifi.position min=0 max=hifi.duration step=1000}}
```

###### Read Only Properties

- `isLoading`         (boolean)
- `isPlaying`         (boolean)
- `isStream`          (boolean)
- `isFastForwardable` (boolean)
- `isRewindable`      (boolean)

- `duration`          (integer, in ms)
- `percentLoaded`     (integer 0-100, when available)

- `currentSound`      the currently loaded sound

### Sound API
###### Methods
- `play()`
Plays the sound
- `pause()`
Pauses the sound
- `fastForward(duration)`
Moves the playhead of the sound forwards by duration (in ms)
- `rewind(duration)`
Moves the playhead of the sound backwards by duration (in ms)

###### Gettable/Settable Properties
- `position` (integer, in ms)

###### Read Only Properties
- `isLoading` (boolean)
- `isPlaying` (boolean)
- `isStream` (boolean)
- `canFastForward` (boolean)
- `canRewind` (boolean)

- `duration` (integer, in ms)
- `percentLoaded` (integer, not always available)
- `url` the url of the sound

### Events
The `hifi` service and the `sound` objects are extended with [Ember.Evented](https://www.emberjs.com/api/classes/Ember.Evented.html). You can subscribe to the following events in your application.

###### Triggered on both the sound and relayed through the hifi service

- `audio-played` (sound) - the sound started playing
- `audio-paused` (sound) - the sound was paused
- `audio-ended` (sound) - the sound finished playing
- `audio-load-error` (error) - loading sound failed
- `audio-ready` (sound) - the sound is ready to play
- `audio-will-rewind` (sound, {currentPosition, newPosition}) - fired before rewinding a sound
- `audio-will-fast-forward` (sound, {currentPosition, newPosition}) - fired before fast-forwarding a sound
- `audio-position-will-change` (sound, {currentPosition, newPosition}) - fired before audio position change

###### Hifi service events
- `current-sound-changed` (currentSound, previousSound) - triggered when the current sound changes. On initial play, previousSound will be undefined.
- `current-sound-interrupted` (currentSound, previousSound) - triggered when a sound has been playing and a new one takes its place by being played, pausing the first one
- `new-load-request` ({loadPromise, urlsOrPromise, options}) - triggered whenever `.load` or `.play` is called.

## Details

### Included audio connections

1. `NativeAudio` - Uses the native `<audio>` element for playing and streaming audio
1. `HLS` - Uses HLS.js for playing HLS streams on the desktop.
1. `Howler` - Uses [howler](http://howlerjs.com) to play audio

`hifi` will take a list of urls and find the first connection/url combo that works. For desktop browsers, we'll try each url on each connection in the order the urls were specified.

For mobile browsers, we'll first try all the URLs on the NativeAudio using a technique to (hopefully) get around any autoplaying restrictions that sometimes require mobile users to click a play button twice.

## Test Helpers
#### Acceptance Tests

Import this helper into acceptance tests to stub out hifi.

```javascript
import '[your-app-name]/tests/helpers/hifi-acceptance-helper';
```

#### Unit Tests + Integration Tests

If you have a unit test that interacts with ember-hifi, you might get some errors if hifi's needs aren't met. Hifi uses some internal services that we'd hate for you to have to know about or type out, so just use our helper instead.

```javascript
import { hifiNeeds, dummyHifi } from 'overhaul/tests/helpers/hifi-integration-helpers';

moduleFor('[your module]', 'Unit | [type] | [your module]', {
  needs: [...hifiNeeds]

...
});
```

If you need to fake out the hifiService to test how your app handles hifi events, you can use the dummyHifi service

```javascript
import { hifiNeeds, dummyHifi } from 'overhaul/tests/helpers/hifi-integration-helpers';

moduleFor('[your module]', 'Integration | [type] | [your module]', {
  needs: [...hifiNeeds],

  beforeEach() {
    this.register('service:hifi', dummyHifi);
    this.inject.service('hifi');
  }
...
});
```

After stubbing out the service with the dummyHifi service you can pass it some special urls in the format `/:status/:length/:name` to mimic responses, where `status` can be `good` or `bad`, and `length` can be an integer representing the duration in ms, or `stream`.

A 10 second audio clip: `/good/10000/test`

A web stream: `/good/stream/test`

A url that will fail: `/bad/stream/test`


## Writing Your Own Hifi Connection

Do you need to support a funky audio format that requires a special library, or do you really want to buck this whole HTML5-only strategy and play sounds using Flash? You can make your own hifi connection.

```sh
$ ember generate hifi-connection flash-connection
```

This creates `app/hifi-connections/flash-connection.js` and a unit test at `tests/unit/hifi-connections/flash-connection.js`, which you should now customize.

The files created by the blueprint should walk you through what you need to implement, but to be thorough:


```javascript
  let ClassMethods = Ember.Mixin.create({
    setup() {
      // Do any global setup needed for your third party library.
    },

    canPlayMimeType(/* extension */) {
      // check if connection can play file with this mime type
      return true;
    },

    canUseConnection() {
      // check to see if this connection will work on this browser/platform
      return true;
    }
  });
```

`canPlayMimeType` and `canUseConnection` are called when `hifi` is looking for connections to try with a url. Give your best guess here. For instance, our built-in HLS.js library won't work on mobile, so `canUseConnection` returns false on a mobile device and true on a desktop browser. Similary, HLS only plays `application/vnd.apple.mpegurl` files, so we just check for that extension in `canPlayMimeType`.

##### Implement methods to bridge communication between hifi and your third party sound.

- `setup()`
Wire up your library to trigger the following methods when things happen on your sound:

Required events to be implemented:
- `sound.trigger('audio-ready')` - sound is ready to play
- `sound.trigger('audio-load-error', error)` - loading sound failed
- `sound.trigger('audio-played')`
- `sound.trigger('audio-paused')`
- `sound.trigger('audio-ended')` - we finished playing the sound

Optional (but nice to have) events:
- `sound.trigger('audio-position-changed')` - when the playhead position changes
- `sound.trigger('audio-loading', {percentLoaded: percent})` - when sound is downloading, update the percentLoaded

```javascript
import flashLibrary from 'your-third-party-library'

let Sound = BaseSound.extend({
  setup() {
    let url   = this.get('url');
    let sound = this;

    let flashSound = new flashLibrary({
      url: url,
      onready: function() {
        // Sound is loaded and ready to go.
        sound.trigger("audio-ready")
      },
      onloaderror: function(error) {
        // Couldn't load this sound. Tell hifi to move on and try another url/connection
        sound.trigger('audio-load-error', error);
      },
      onpause: function() {
        sound.trigger('audio-paused', sound);
      },
      onplay: function() {
        sound.trigger('audio-played', sound);
      },
      onend: function() {
        sound.trigger('audio-ended', sound);
      },
      onseek: function() {
        sound.trigger('audio-position-changed');
      },
      onloading: function(percentLoaded) {
        sound.trigger('audio-loading', {percentLoaded: percentLoaded});
      }
    })

    this.set('flashSound', flashSound);
  }
```

- `teardown`

```javascript
  // clean up after yourself
  teardown() {
    this.get('flashSound').destroy();
  }
```

### Other required methods to let hifi control your sound

```javascript
_setVolume(volume) {
  this.get('flashSound').volume(volume);
},

_audioDuration() { // in ms
  // return Infinity if source is an audio stream
  if (this.get('flashSound').isStreaming()) {
    return Infinity
  }
  else {
    return this.get('flashSound').duration    
  }
},

_currentPosition() { // in ms
  return this.get('flashSound').position
},

_setPosition(pos) { // in ms
  return this.get('flashSound').setPosition(pos)
},

play() {
  this.get('flashSound').play();
},

pause() {
  this.get('flashSound').pause();
},

stop() {
  // Stop playback and make sure no more audio is downloading
  this.get('flashSound').stopDownload();
  this.get('flashSound').stop();
}

```

### Usage

Once you have implemented your new connection, you can add it to your app's configuration, like so:

```js
module.exports = function(environment) {
  var ENV = {
    emberHifi:
      debug: true,    // get ready for some deep console messages to help you find your way
      connections: [
        {
          name: 'FlashConnection',
          config: {
            options: { // these options get passed into your class-level setup
              foo: 'bar'
            }
          }
        }
      ]
    }
  }
```
