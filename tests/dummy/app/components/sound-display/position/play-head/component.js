import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';

export default Component.extend(RecognizerMixin, {
  layout,

  classNames: ['progress-track-playhead'],
  recognizers: 'pan',
  attributeBindings: ['style'],

  onPan: function() {},
  style: alias('positionStyle'),

  panEnd(e) {
    const {
      deltaX
    } = e.gesture;

    this.onPanEnd(deltaX);
  },

  pan(e) {
    const {
      deltaX
    } = e.gesture;

    this.onPan(deltaX);
  }
});
