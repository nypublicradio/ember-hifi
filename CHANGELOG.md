# ember-hifi Changelog
### 1.12.0 (October 18, 2017)
- [IMPROVEMENT] Pass config-level `options` object to Howler instances during init

### 1.11.4 (August 30, 2017)
- [BUGFIX] Native Audio sounds weren't firing their `audio-loaded` event. Fix it!

### 1.11.3 (August 15, 2017)
- [BUGFIX] Stop dummyHifi ticking after an audio-end signal, which can cause audio-end signals to continue sending for all eternity leaving tests to wait.

### 1.11.2 (August 4, 2017)
- [BUGFIX] Remove IE11 workarounds. The issue these corrected has since been fixed by more robust event handling by hifi. This also fixes issues with upstream apps waiting for `pause` events, since finished sounds would also fire pause events.

### 1.11.1 (June 27, 2017)
- [BUGFIX] Fix a test by using `checkWaiters`
- [IMPROVEMENT] Docs deploys should be more reliable now with the `--pure-lockfile` flag
- [IMPROVEMENT] Remove unneeded ember-power-select addons

### 1.11.0 (June 26, 2017)
- [IMPROVEMENT] `ember-hifi` no longer adds bower dependencies. Thanks to [@gmurphey](https://github.com/gmurphey) for [#41](https://github.com/nypublicradio/ember-hifi/pull/41). See [Upgrading](https://github.com/nypublicradio/ember-hifi#upgrading-from--1110) for more.

### 1.10.1 (June 4, 2017)
- Quieted most of the logging messages for how to handle special urls when using dummyHifi

### 1.10 (June 1, 2017)
- [IMPROVEMENT] Improved dummyHifi service to better mimic a real sound.
- [IMPROVEMENT] Added `new-load-request` and `current-sound-interrupted` on the service.
- [IMPROVEMENT] Added `audio-position-will-change`, `audio-will-rewind`, and `audio-will-fast-forward` on the Base sound.
- [BUGFIX] Fixed opera bug where native audio element with a stream source didn't report as having Infinity duration

### 1.9.1 (May 12, 2017)
- [BUGFIX] `hifiNeeds` test helper didn't include all needed services (it was missing `service:poll`)

### 1.9.0 (May 10, 2017)
- [IMPROVEMENT] Changed API (and documented) `current-sound-changed` to `(currentSound, previousSound)` from `({previousSound, currentSound})` to be more consistent with the other APIs.
- [BUGFIX] Make sure events of the not-yet-current sound are relayed through hifi. Previously current sound would be set on `audio-played`, and that `audio-played` event wasn't relayed through the service.
- [BUGFIX] Fix pause event so it gets triggered properly when using a shared audio element. Previously, when ownership of the audio element was transferred between sounds, the sound releasing control did not properly trigger a pause event on the service.
- Upgrade to eslint and yarn.

### 1.8.0 (April 19, 2017)
- [#35](https://github.com/nypublicradio/ember-hifi/pull/35) [IMPROVEMENT] - Add another method to get around iOS autoplay restrictions. If on mobile, we now add a document `touchstart` listener that will trigger a play on touch if the sound hasn't played yet.
- [#34](https://github.com/nypublicradio/ember-hifi/pull/34) [IMPROVEMENT] - Add service level 'current-sound-changed' event, and allowed metadata to be attached to sound at play time so consumers can retrieve it later

### 1.7.4 (March 15, 2017)
- [#31](https://github.com/nypublicradio/ember-hifi/pull/31) [BUGFIX] - Wire up DummyConnection to fire real events
- f4678a2 Re enable canary because it passes now
- [#32](https://github.com/nypublicradio/ember-hifi/pull/32) [IMPROVEMENT] - Don't resolve `.play` until the chosen sound actually fires its `audio-played` event, so that the service can properly expose its aliased computed props.
- 2deba6d [IMPROVEMENT] - Tweak `included` hook so that `ember-hifi` can be nested under other addons.

### 1.7.3 (March 1, 2017)
- [BUGFIX] Fix my goof from yesterday and use preload='none' instead of not having the src, since IE freaks out about the latter.

### 1.7.2 (February 28, 2017)
- [BUGFIX] Resolve issue where two requests would happen for one piece of audio when using a shared audio element. We don't save the src on the shadowAudio element when saving audio state anymore, and it turns out that wasn't instantly resuming audio when switching between audio sources like we thought it was anyway.

### 1.7.1 (February 15, 2017)
- [BUGFIX] Fixed error that was getting thrown in the logging and causing a strange error when debugging was enabled
- [BUGFIX] Fix out of sync loading indicators by forcing notifyPropertyChanges with isLoading.

### 1.7.0 (February 3, 2017)
- [BUGFIX] Don't autoplay the blank audio element on desktop browsers if using a single audio element. IE can't deal with it, and audio will start playing before events are wired up. Also handle case where IE errors after trying to set `.currentTime` on the audio element.
- [IMPROVEMENT] - Refactoring debug logger and included better debug messages, especially around transferring of audio control when using a single audio element.
- [BUGFIX] Don't set isLoading flag to false right away after retreiving a sound from the cache. This fixes a problem where after resuming audio from a stopped stream `hifi` would report `isLoading = false`, making buttons show up as playing when it was really loading stuff up again.
- Updated ember try scenarios and fix some deprecation warnings.

### 1.6.0 (January 26, 2017)
- 3433e18 -  `alwaysUseSharedAudioElement: true` in the emberHIfi config will now force hifi to use a single shared audio element all the time, instead of just on mobile browsers as is done normally. This resolves an issue with cookied content providers that limit one connection per client (in this case, adswizz on wnyc) where without this option audio might stall out when switching between different audio resources.
- set `isDevelopingAddon` to `false`, since this is released.
- Fixed some test failures on ember-beta and ember-canary

### 1.5.0 (November 14, 2016)
- dbc80f4 [BUGFIX] - gets rid of 'audio-stopped' event, which wasn't in use. replace it with 'audio-ended' and make sure Howler sends the correct event. Thanks to @aaronfischer for bringing it up, even though the bug he was experiencing turned to be a server-side thing.
- 0574a94 [BUGFIX] - only track internal audio element state if we're on mobile. fixes bad playback behavior on firefox.
- [IMPROVEMENT] - Allow passing in of event callbacks. Useful for testing.
- Update to ember 2.9.1

### 1.4.1 (October 31, 2016) :pumpkin:
- start dummy connections with a 0 position

### 1.4.0 (October 31, 2016) :pumpkin:
- 3a9438 [BUGFIX] - Handle audio position overruns
- 460149 [IMPROVEMENT] - `.play` on the Service and Connections accepts an options hash. The only option currently supported is `position`, so you can `sound.play({position: 0})` to restart a sound.
- Change when some properties are updated for snappier feedback
- [#18](https://github.com/nypublicradio/ember-hifi/pull/18) [IMPROVEMENT] - Adds a `SharedAudioAccess` library to manage access to a singleton HTML5 Audio element on mobile devices. This is due to the long-standing iOS issue with calling `play` on an audio element that is not in direct response to a user action like a `click` or `tap`. This allows us to do things like playlist playback on mobile.
- Other improvements: include silent MP3 files for testing, fix soundcache issue caching identical sounds more than once.

### 1.3.3 (October 19, 2016)
- Attaches failures to load `catch` case

### 1.3.2 (October 19, 2016)
- Fixes `percentLoaded` attr on native audio connection

### 1.3.1 (October 19, 2016)
- [#17](https://github.com/nypublicradio/ember-hifi/pull/17) [BUGFIX] - Improves stream pausing
- Test & deprecation warning cleanup
- 9fd95bb Manually manage `isLoading` state in a couple spots

### 1.3.0 (October 14, 2016)
- Add 'isErrored' boolean property and 'error' string property to sounds as a first step of being able to recover from play errors

- Go back to setting the `src` property on native audio to an empty string instead of a blob, and just mute the audio errors when we've explicitly stopped loading

- [#15](https://github.com/nypublicradio/ember-hifi/issues/15) [BUGFIX] - Cache sounds correctly when the url is specified as a hash with the mimeType.

### 1.2.3 (October 12, 2016)
- Fixing event relaying logic so that handlers won't be registered more than once, causing multiple relay calls to be sent for for a single sound event. This was problematic with the `audio-ended` event, causing tracks to get skipped in a playlist.

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
