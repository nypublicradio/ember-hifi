function setupHLSSpies(hls, sandbox) {
  return {
    recoverSpy  : sandbox.spy(hls, 'recoverMediaError'),
    switchSpy   : sandbox.spy(hls, 'swapAudioCodec'),
    destroySpy  : sandbox.spy(hls, 'destroy')
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
