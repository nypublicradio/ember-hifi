import PromiseTry from 'dummy/utils/promise-try';
import { module, test } from 'qunit';

module('Unit | Utility | promise try');

test('it should return the even number in this even/odd test', function(assert) {
  let done = assert.async();

  PromiseTry.findFirst([1,3,5,6,8,9], function(nextParam, returnSuccess, markFailure) {
    if ((nextParam % 2) === 0) {
      returnSuccess(nextParam);
    }
    else {
      markFailure();
    }
  }).then(({result}) => {
    assert.equal(6, result);
    done();
  });
});

test('findFirst should reject if all the params have been tried and nothing calls returnSuccess', function(assert) {
  let done = assert.async();
  let paramsTried = [];
  let params = [1,3,5,6,8,9];
  PromiseTry.findFirst(params, function(nextParam, returnSuccess, markFailure) {
    paramsTried.push(nextParam);
    markFailure(nextParam);
  }).catch(({failures}) => {
    assert.equal(params.length, 6, "it should not have modified the params passed in");
    assert.equal(paramsTried.length, params.length, "should have tried all the parameters");
    assert.deepEqual(failures, params, "all params should be recorded as failures");
    done();
  });
});

test('findFirst should not try the rest of the items if the first one resolves', function(assert) {
  let done = assert.async();
  let paramsTried = [];
  let params = [1,3,5,6,8,9];
  PromiseTry.findFirst(params, function(nextParam, returnSuccess /*, markFailure */) {
    paramsTried.push(nextParam);
    returnSuccess(nextParam);
  }).then(({result, failures}) => {
    assert.equal(paramsTried.length, 1, "should have tried only one parameter");
    assert.equal(result, 1, "should have returned the first one");
    assert.deepEqual(failures, [], "there should be no rejections");
    done();
  });
});
