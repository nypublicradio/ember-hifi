import SharedAudioAccess from 'dummy/utils/shared-audio-access';
import { module, test } from 'qunit';
import sinon from 'sinon';

let audioElement = document.createElement('audio');

module('Unit | Utility | shared audio element', {
  beforeEach() {
    sinon.stub(SharedAudioAccess, '_createElement').returns(audioElement);
  },
  afterEach() {
    SharedAudioAccess._reset();
    SharedAudioAccess._createElement.restore();
  }
});

test('it works', function(assert) {
  let result = SharedAudioAccess.unlock();
  assert.ok(result);
});

test('restricts access to the audio element', function(assert) {
  let sharedAudioAccess = SharedAudioAccess.unlock();
  let foo = { debug: function() {} };
  let bar = { debug: function() {} };
  sharedAudioAccess.requestControl(foo);

  assert.ok(sharedAudioAccess.hasControl(foo), 'foo has access');
  assert.notOk(sharedAudioAccess.hasControl(bar), 'bar does not have access');
  sharedAudioAccess.releaseControl(foo);
  assert.notOk(sharedAudioAccess.hasControl(bar), 'bar does not have access until it requests it');
  sharedAudioAccess.requestControl(bar);
  assert.ok(sharedAudioAccess.hasControl(bar), 'bar now can have access');
});

test('only plays blank element when asked to', function(assert) {
  let playSpy = sinon.spy(audioElement, 'play');
  SharedAudioAccess.unlock();
  assert.equal(playSpy.callCount, 0, "play spy hasn't been called");
  audioElement.play.restore();
});

test('only plays blank element when asked to', function(assert) {
  let playSpy = sinon.spy(audioElement, 'play');
  SharedAudioAccess.unlock(true);

  assert.equal(playSpy.callCount, 1, "play spy was called");
  audioElement.play.restore();
});
