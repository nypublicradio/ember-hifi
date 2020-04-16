# To Document


### Service
* api
  * `play`
  * `load`
  * `pause`
  * `togglePause`
  * `fastForward`
  * `rewind`
* properties
  * `volume`
  * `position`
  * `isLoading`
  * `isPlaying`
  * `isStream`
  * `isFastForwardable`
  * `isRewindable`
  * `duration`
  * `percentLoaded`
  * `currentSound`
* events
  * `current-sound-changed`

### Connections
* `NativeAudio`
* `HLS`
* `Howler`


### Sound Object
* api
  * `play`
  * `pause`
  * `fastForward`
  * `rewind`
* properties
  * `position`
  * `isLoading`
  * `isPlaying`
  * `isStream`
  * `canFastForward`
  * `canRewind`
  * `duration`
  * `percentLoaded`
  * `url`

### Advanced Usage
* `play` accepts an Array and a Promise
* `play` options
* `sound-changed` event
* testing
* more on custom connections
