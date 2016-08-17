import RSVP from 'rsvp';
import Ember from 'ember';
/**
 * Given an array of params, this will go through the list one-by-one and call your
 * callback function until your function calls stopAndResolve, at which point the
 * main Promise will resolve with that thing you passed it.
 *
 * The callback should have the following arguments (nextParam, stopAndResolve, tryNextParameter)

 * Your callback should do what it needs to do and if that thing is good, pass it to
 * stopAndResolve. If that thing is bad call tryNextParameter
 *
 * @method findFirst
 * @param {Array} params
 * @param {Function} callback(nextParam, stopAndResolve, tryNextParameter)
 * @returns {Promise.<whatever-you-pass-stopAndResolve|error>}
 */

function findFirst(params, callback) {
  let paramsToTry = Ember.copy(params);
  let rejections = [];
  return new RSVP.Promise((resolve, reject) => {
    (function tryNext(tryThis) {
      tryThis
        .then(resolve)
        .catch((rejection) => {
          rejections.push(rejection);
          let nextParam = paramsToTry.shift();
          if (!nextParam) {
            reject(rejections);
          }
          else {
            return tryNext(promisifyCallback(callback, nextParam));
          }
      });
    })(promisifyCallback(callback, paramsToTry.shift()));
  });
}

function promisifyCallback(callback, nextParam) {
  return new RSVP.Promise((stopAndResolve, tryNext) => {
    callback(nextParam, stopAndResolve, tryNext);
  });
}

export default {
  findFirst: findFirst
};
