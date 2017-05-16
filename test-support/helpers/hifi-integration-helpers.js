import Service from 'ember-hifi/services/hifi';
import DummyConnection from 'ember-hifi/hifi-connections/dummy-connection';
import hifiNeeds from './hifi-needs';

const dummyHifi = Service.extend({
  init: function() {
    this.set('options', {
      emberHifi: {
        connections: [{
          name: 'DummyConnection',
          config: {
            testOption: 'DummyConnection'
          }
        }]
      }
    });
    this._super(...arguments);
  },
  _lookupConnection: function() {
    return DummyConnection;
  }
});


export {
  DummyConnection,
  dummyHifi,
  hifiNeeds
};
