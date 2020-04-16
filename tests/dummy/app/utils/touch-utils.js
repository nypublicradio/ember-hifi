
// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events#Finding_an_ongoing_touch
export function findTouchById(touchList, identifier) {
  for (let i = 0; i < touchList.length; i++) {
    let touch = touchList.item(i);
    if (touch.identifier === identifier) {
      return touch;
    }
  }
}

// If defaults are not prevented, certain touch events on devices will also send mouse
// events.  For example, a quick 'touchstart', 'touchend' might also fire 'mousedown',
// 'mouseup', and 'clickevents'; Someplatforms leave telltale signs of these events, which
// is useful when we want to distinguish a touch from a click but can't guarantee that
// defaults on a touch event were prevented.

// NOTE:
// This won't detect simulated events from mobile safari, but in our setup those are intercepted and replaced
// with events from fastclick, which we can detect.
export function isSimulatedMouseEvent(mouseEvent) {
  if (mouseEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/InputDeviceCapabilities
    const isChromeFakeEvent = mouseEvent.sourceCapabilities && mouseEvent.sourceCapabilities.firesTouchEvents === true;
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/mozInputSource
    const isMozFakeEvent = mouseEvent.mozInputSource === 5;
    // https://github.com/ftlabs/fastclick/blob/3db9f899c25b7b2e1517dc5cc17494ec9094bc43/lib/fastclick.js#L304
    const isFastClickFakeEvent = mouseEvent.forwardedTouchEvent === true;

    return isChromeFakeEvent || isMozFakeEvent || isFastClickFakeEvent;
  }
  return false;
}
