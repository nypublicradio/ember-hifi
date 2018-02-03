import Evented from '@ember/object/evented';
import EmberObject from '@ember/object';
import { A as emberArray } from '@ember/array';

export default EmberObject.extend(Evented, {
  init() {
    this.set('sounds', emberArray());
  },

  register(sound) {
    let sounds = this.get("sounds");
    sound.on('audio-played', () => this.pauseAll(sound));
    if (!sounds.includes(sound)) {
      sounds.pushObject(sound);
    }
  },

  pauseAll(sound) {
    this.get('sounds').without(sound).forEach(this._pauseSound);
  },

  _pauseSound(s) { s.pause(); }

});
