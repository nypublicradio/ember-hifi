import sinon from 'sinon';

function setupHLSSpies(hls) {
  return {
    recoverSpy  : sinon.spy(hls, 'recoverMediaError'),
    switchSpy   : sinon.spy(hls, 'swapAudioCodec'),
    destroySpy  : sinon.spy(hls, 'destroy')
  };
}

function throwMediaError(sound) {
  let fakeError = {
    target: {
      error: {
        code: 3,
        MEDIA_ERR_DECODE: 3
      }
    }
  };

  sound._onVideoError(fakeError);
}

export {
  throwMediaError,
  setupHLSSpies
};
