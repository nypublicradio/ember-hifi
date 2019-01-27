import Component from '@ember/component';
import layout from './template';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';
import Ember from 'ember';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { inject as service } from '@ember/service';
import { next } from '@ember/runloop';
export default Component.extend(RecognizerMixin, {
  layout,
  recognizers: 'pan tap',
  hifi: service(),
  dragAdjustment: 0,
  numOfNotches: computed('notchCount', function() {
    return new Array(this.notchCount);
  }),
  notchCount: 20,
  activeNotches: computed('notchCount', 'hifi.volume', 'dragAdjustment', function() {
    let dragAdjustment = (this.dragAdjustment / this.element.getBoundingClientRect().width) * 100;
    let value           = this.hifi.volume + dragAdjustment;
    return Math.floor(value / (100 / this.notchCount));
  }),

  classNames: ['volume-control'],

  panEnd(e) {
    const {
      deltaX
    } = e.originalEvent.gesture;

    let width            = this.element.getBoundingClientRect().width;
    let change           = parseInt((deltaX / width) * 100, 10)
    let newVolume        = this.hifi.volume + change
    next(() => {
      this.set('dragAdjustment', 0);
      this.set('hifi.volume', Math.max(Math.min(newVolume, 100), 0));
    })
  },
  pan(e) {
    const {
      deltaX
    } = e.originalEvent.gesture;

    this.set('dragAdjustment', deltaX);
  },

  tap(e) {
    const {
      center
    } = e.originalEvent.gesture;
    let rect             = this.element.getBoundingClientRect();
    let volumePercentage = ((center.x - rect.x)/rect.width) * 100;
    let newVolume        = Math.max(Math.min(volumePercentage, 100), 0);
    next(() => {
      this.set('hifi.volume', newVolume);
    })
  },

});
