import Component from '@ember/component';
import layout from './template';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';
import Ember from 'ember';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend(RecognizerMixin, {
  layout,

  classNames: ['progress-track-playhead'],
  recognizers: 'pan',
  attributeBindings: ['style'],

  onPan: function() {},
  style: computed.alias('positionStyle'),

  panEnd(e) {
    const {
      deltaX
    } = e.originalEvent.gesture;

    this.onPanEnd(deltaX);
  },

  pan(e) {
    const {
      deltaX
    } = e.originalEvent.gesture;

    this.onPan(deltaX);
  }
});
