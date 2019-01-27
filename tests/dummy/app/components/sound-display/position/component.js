import Component from '@ember/component';
import layout from './template';
import { set, get, computed, getProperties } from '@ember/object';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';
import { htmlSafe } from '@ember/string';
import { bool } from '@ember/object/computed';
import { bind } from '@ember/runloop';
import { throttle, next } from '@ember/runloop';

export default Component.extend(RecognizerMixin, {
  layout,
  recognizers             : 'tap',
  dragAdjustment          : 0,
  classNames              : ['sound-display-control-position'],
  downloadedPercentage    : computed('downloaded', function() {
    let downloaded = get(this, 'downloaded');
    return htmlSafe(`width: ${(downloaded) * 100}%;`);
  }),

  playedPercentage        : computed('sound.position', 'sound.duration', function() {
    if (this.sound && this.sound.duration !== Infinity) {
      let position = get(this, 'sound.position');
      let duration = get(this, 'sound.duration');
      return position/duration;
    }
    else {
      return 0;
    }
  }),

  playedPercentageStyle: computed('playedPercentage', function() {
    return htmlSafe(`width: ${(this.playedPercentage) * 100}%;`);
  }),

  durationIsInfinity: computed('sound.duration', function() {
    return (get(this, 'sound.duration') === Infinity);
  }),

  playHeadPositionStyle: computed('playedPercentage', 'dragAdjustment', function() {
    let dragAdjustmentPercentage = (this.dragAdjustment / this.element.getBoundingClientRect().width);
    let p = this.playedPercentage + dragAdjustmentPercentage;
    let percent = parseFloat(p, 10) * 100;

    return htmlSafe(`left : ${Math.max(0, Math.min(percent, 100))}%;`);
  }),

  tap(e) {
    console.log(e.originalEvent.gesture);
    const {
      center
    } = e.originalEvent.gesture;
    let rect = this.element.getBoundingClientRect();
    let positionPercentage = ((center.x - rect.x)/rect.width)
    let newPosition      = parseFloat(this.sound.duration * positionPercentage, 10);
    next(() => {
      this.set('sound.position', newPosition);
      this.set('dragAdjustment', 0);
    })
  },

  actions: {
    updatePosition(deltaX) {
      let width = this.element.getBoundingClientRect().width;
      let changePercentage = (deltaX / width)
      let newPercentage    = this.playedPercentage + changePercentage;
      let newPosition      = parseFloat(this.sound.duration * newPercentage, 10);
      next(() => {
        this.set('sound.position', newPosition);
        this.set('dragAdjustment', 0);
      })
    },
    updatePlayheadPosition(deltaX) {
      throttle(this, () => {
        this.set('dragAdjustment', deltaX)
      }, 200)
    }
  }
});
