# ember-hifi Changelog

### 1.2.2 (October 11, 2016)
- Set isLoading flag when reloading audio after being stopped

### 1.2.1 (October 11, 2016)
- Added a 'loadeddata' event listener to Native Audio, since Firefox doesn't trigger a 'canplay' until after you've asked the audio to play.

- Suppressed occasional invalid audio errors while Native Audio was stopped and the src attribute was changed to prevent loading.

### 1.2.0 (October 6, 2016)
- Renamed some internal services and added a unit test helper for adding `needs` (so consumers don't have to know about the internal services) since Ember doesn't have a great solution for that yet.

### 1.1.4 (October 5, 2016)

- Explicitly stop the audio after playback has ended for IE11, who never learned to communicate properly.

### 1.1.3 (October 4, 2016)

- Improved logic to prevent browser from loading a paused stream on the native audio connection. Instead of setting <audio> src to empty, we now set it to an empty blob so the audio element won't throw an error on pause (on mobile), which caused issues when switching between different audio streams.
- Increased timeout for mobile click blocker to 2s due to some false positives

### 1.1.2 (October 4, 2016)

- Added toggleMute method on the service for easy mute toggling

### 1.1.1 (September 29, 2016)

- [#11](https://github.com/nypublicradio/ember-hifi/issues/11) [BUGFIX] Use the ember run loop so the pause event gets fired correctly when stopping NativeAudio.
- [#12](https://github.com/nypublicradio/ember-hifi/issues/12) [BUGFIX] Fix issue with .aac files returning a mime-type of audio/x-aac, then causing the (Native Audio) audio element to think it can't play aac files

### 1.1.0 (September 26, 2016)

- [#9](https://github.com/nypublicradio/ember-hifi/pull/9) [BUGFIX] Pause streams by setting `src` attribute of Nativ Audio element to the empty string rather than using `removeAttribute`.
- [#10](https://github.com/nypublicradio/ember-hifi/pull/10) Use mime types to determine connection support for a given audio url. If a mime type cannot be derived, try it anyway but warn the user about performance implications.
- Increases timeout on CircleCI for test runs
- Removes `ember-poll` as a duplicate dependency

### 1.0.2 (September 20, 2016)

- Skips 1.0.1 because I've never used `npm publish` before.
- Updates package.json with correct `ember-poll` dependency and adds a repo URL.

### 1.0.0 (September 16, 2016)

- Initial release. See [README.md](https://github.com/nypublicradio/ember-hifi/blob/master/README.md) for more.
