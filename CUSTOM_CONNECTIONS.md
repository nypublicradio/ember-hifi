
## Writing Your Own Hifi Connection

Do you need to support a funky audio format that requires a special library, or do you really want to buck this whole HTML5-only strategy and play sounds using Flash? You can make your own hifi connection.

```sh
$ ember generate hifi-connection flash-connection
```

This creates `app/hifi-connections/flash-connection.js` and a unit test at `tests/unit/hifi-connections/flash-connection.js`, which you should now customize.

The files created by the blueprint should walk you through what you need to implement, but to be thorough:


```javascript
  let ClassMethods = Ember.Mixin.create({
    setup() {
      // Do any global setup needed for your third party library.
    },

    canPlayMimeType(/* extension */) {
      // check if connection can play file with this mime type
      return true;
    },

    canUseConnection() {
      // check to see if this connection will work on this browser/platform
      return true;
    }
  });
```

`canPlayMimeType` and `canUseConnection` are called when `hifi` is looking for connections to try with a url. Give your best guess here. For instance, our built-in HLS.js library won't work on mobile, so `canUseConnection` returns false on a mobile device and true on a desktop browser. Similary, HLS only plays `application/vnd.apple.mpegurl` files, so we just check for that extension in `canPlayMimeType`.

##### Implement methods to bridge communication between hifi and your third party sound.

- `setup()`
Wire up your library to trigger the following methods when things happen on your sound:

Required events to be implemented:
- `sound.trigger('audio-ready')` - sound is ready to play
- `sound.trigger('audio-load-error', error)` - loading sound failed
- `sound.trigger('audio-played')`
- `sound.trigger('audio-paused')`
- `sound.trigger('audio-ended')` - we finished playing the sound

Optional (but nice to have) events:
- `sound.trigger('audio-position-changed')` - when the playhead position changes
- `sound.trigger('audio-loading', {percentLoaded: percent})` - when sound is downloading, update the percentLoaded

```javascript
import flashLibrary from 'your-third-party-library'

let Sound = BaseSound.extend({
  setup() {
    let url   = this.get('url');
    let sound = this;

    let flashSound = new flashLibrary({
      url: url,
      onready: function() {
        // Sound is loaded and ready to go.
        sound.trigger("audio-ready")
      },
      onloaderror: function(error) {
        // Couldn't load this sound. Tell hifi to move on and try another url/connection
        sound.trigger('audio-load-error', error);
      },
      onpause: function() {
        sound.trigger('audio-paused', sound);
      },
      onplay: function() {
        sound.trigger('audio-played', sound);
      },
      onend: function() {
        sound.trigger('audio-ended', sound);
      },
      onseek: function() {
        sound.trigger('audio-position-changed');
      },
      onloading: function(percentLoaded) {
        sound.trigger('audio-loading', {percentLoaded: percentLoaded});
      }
    })

    this.set('flashSound', flashSound);
  }
```

- `teardown`

```javascript
  // clean up after yourself
  teardown() {
    this.get('flashSound').destroy();
  }
```

### Other required methods to let hifi control your sound

```javascript
_setVolume(volume) {
  this.get('flashSound').volume(volume);
},

_audioDuration() { // in ms
  // return Infinity if source is an audio stream
  if (this.get('flashSound').isStreaming()) {
    return Infinity
  }
  else {
    return this.get('flashSound').duration    
  }
},

_currentPosition() { // in ms
  return this.get('flashSound').position
},

_setPosition(pos) { // in ms
  return this.get('flashSound').setPosition(pos)
},

play() {
  this.get('flashSound').play();
},

pause() {
  this.get('flashSound').pause();
},

stop() {
  // Stop playback and make sure no more audio is downloading
  this.get('flashSound').stopDownload();
  this.get('flashSound').stop();
}

```

### Usage

Once you have implemented your new connection, you can add it to your app's configuration, like so:

```js
module.exports = function(environment) {
  var ENV = {
    emberHifi:
      debug: true,    // get ready for some deep console messages to help you find your way
      connections: [
        {
          name: 'FlashConnection',
          config: {
            options: { // these options get passed into your class-level setup
              foo: 'bar'
            }
          }
        }
      ]
    }
  }
```
