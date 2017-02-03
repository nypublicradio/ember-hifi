import Ember from 'ember';
const { getWithDefault, get, set } = Ember;
import Debug from '../utils/debug';

// Keep this object around to keep track of logs.
const DebugLogging = Ember.Object.create({
  loggers: {},

  findOrCreateLogger(name) {
    let loggerMap = this.get('loggers');
    let logger    = get(loggerMap, name);

    if (!logger) {
      logger = new Debug(name);
      set(loggerMap, name, logger);
    }

    return logger;
  },

  log(name, message) {
    this.findOrCreateLogger(name).log(message);
  },

  timeStart(name, timerName) {
    this.findOrCreateLogger(name).time(timerName);
  },

  timeEnd(name, timerName) {
    this.findOrCreateLogger(name).timeEnd(timerName);
  }
});

export default Ember.Mixin.create({
  debugName: 'ember-hifi',

  debugEnabled: Ember.computed(function() {
    let owner = Ember.getOwner(this);
    // We need this calculated field in the mixin because configuration gets looked up on the container.
    if (owner) { // if there's no owner, we're not quite initialized yet
      let config = owner.resolveRegistration('config:environment') || {};
      return getWithDefault(config, 'emberHifi.debug', false);
    }
  }),

  debug() {
    if (!this.get('debugEnabled')) { return; }

    if (arguments.length === 1) {
      DebugLogging.log(get(this, 'debugName'), arguments[0]);
    }
    else if (arguments.length === 2) {
      DebugLogging.log(arguments[0], arguments[1]);
    }
  },

  timeStart() {
    if (!this.get('debugEnabled')) { return; }

    DebugLogging.timeStart(...arguments);
  },

  timeEnd() {
    if (!this.get('debugEnabled')) { return; }

    DebugLogging.timeEnd(...arguments);
  }
});
