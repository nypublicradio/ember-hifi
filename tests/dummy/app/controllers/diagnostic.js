import Controller from '@ember/controller';
/* TODO: check expected values visually to make sure expected input in browser X = expected output */

const AAC_STREAM = {
  title: 'AAC Stream',
  url: 'https://fm939.wnyc.org/wnycfm.aac',
  expectedValues: {
    url: 'https://fm939.wnyc.org/wnycfm.aac',
    duration: Infinity,
    connectionName: "NativeAudio",
    hasPlayed: false,
    isStream: true,
    isFastForwardable: false,
    isRewindable: false,
    position: 0
  }
};

const MP3_ON_DEMAND = {
  title: 'MP3 On Demand',
  url: 'https://www.podtrac.com/pts/redirect.mp3/audio.wnyc.org/otm/otm04212017pod.mp3',
  expectedValues: {
    url: 'https://www.podtrac.com/pts/redirect.mp3/audio.wnyc.org/otm/otm04212017pod.mp3',
    duration: Infinity,
    connectionName: "NativeAudio",
    hasPlayed: false,
    isStream: false,
    isFastForwardable: true,
    isRewindable: true,
    position: 0
  }
};

const STREAM_WITHOUT_EXTENSION = {
  title: 'WQXR Stream (no extension)',
  url: 'https://stream.wqxr.org/wqxr',
  expectedValues: {
    url: 'https://stream.wqxr.org/wqxr',
    duration: Infinity,
    connectionName: "NativeAudio",
    hasPlayed: false,
    isStream: true,
    isFastForwardable: false,
    isRewindable: false,
    position: 0
  }
};

const HLS_FIXED_LENGTH = {
  title: "HLS On Demand",
  url: 'https://cdn.rasset.ie/manifest/audio/2018/0917/20180917_rteradio1-ryantubridy-theryantub_cl10935275_10937556_261_/manifest.m3u8',
  expectedValues: {
    duration: Infinity,
    connectionName: "HLS",
    hasPlayed: false,
    isStream: false,
    isFastForwardable: true,
    isRewindable: true,
    position: 0
  }
}

const HLS_LIVE_STREAM = {
  title: "KUTX HLS Stream",
  url: "https://kut-hls.streamguys1.com/kut2/playlist.m3u8",
  expectedValues: {
    duration: Infinity,
    connectionName: "HLS",
    hasPlayed: false,
    isStream: true,
    isFastForwardable: false,
    isRewindable: false,
    position: 0
  }
}

const KOOP_STREAM = {
  title: "KOOP AAC Stream",
  url: "http://streaming.koop.org:8534/;stream.aac",
  expectedValues: {
    duration: Infinity,
    connectionName: "NativeAudio",
    hasPlayed: false,
    isStream: true,
    isFastForwardable: false,
    isRewindable: false,
    position: 0
  }
}

import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Controller.extend({
  hifi: service(),
  init() {
    this.set('testSounds', [
      AAC_STREAM,
      STREAM_WITHOUT_EXTENSION,
      MP3_ON_DEMAND,
      HLS_FIXED_LENGTH,
      HLS_LIVE_STREAM,
      KOOP_STREAM
    ]);

    this._super(...arguments);
  },

  connections: computed("hifi._connections", function() {
    return Object.values(this.hifi._connections);
  }),

});
