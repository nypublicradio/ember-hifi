import RSVP from 'rsvp';

function findFirst(params, callback) {
  let rejections = [];
  console.log("trying the following: ");
  console.log(params);
  return new RSVP.Promise((resolve, reject) => {
    (function tryNext(tryThis) {
      tryThis
        .then(resolve)
        .catch((rejection) => {
          rejections.push(rejection);
          let nextParam = params.shift();
          if (!nextParam) {
            reject(rejections);
          }
          else {
            return tryNext(callback(nextParam));
          }
      });
    })(callback(params.shift()));
  });
}

export default {
  findFirst: findFirst
};
