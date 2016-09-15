import Ember from 'ember';
import Debug from '../utils/debug';
export default Ember.Service.extend({
  // A service to help try and keep track of the requests and attempts
  // at loading a url with multiple audio connections, basically wrapping
  // the Debug() class

  enabled: true,

  init() {
    this.set('loggers', new Ember.Map());
  },

  findOrCreateLogger(name) {
    let loggerMap = this.get('loggers');
    let logger    = loggerMap.get(name);

    if (!logger) {
      logger = new Debug(name);
      loggerMap.set(name, logger);
    }

    return logger;
  },

  log(name, message) {
    if (this.get('enabled')) {
      this.findOrCreateLogger(name).log(message);
    }
  },

  timeStart(name, timerName) {
    if (this.get('enabled')) {
      this.findOrCreateLogger(name).time(timerName);
    }
  },

  timeEnd(name, timerName) {
    if (this.get('enabled')) {
      this.findOrCreateLogger(name).timeEnd(timerName);
    }
  }
});
