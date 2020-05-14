import Component from '@ember/component';
import layout from './template';
import { computed } from "@ember/object";
import { EVENT_MAP, SERVICE_EVENT_MAP } from 'ember-hifi/services/hifi';
import { A } from '@ember/array';
import { set } from "@ember/object";

export default Component.extend({
  layout,

  classNames: ['diagnostic-debug-events'],
  eventListGroupings: computed('eventsList.length', function() {
    let groupedEvents = [];

    this.eventsList.forEach(e => {
      let lastItem = groupedEvents.pop()
      if (lastItem && lastItem.name == e.name) {
        set(lastItem, 'count', lastItem.count + 1); // eslint-disable-line
        groupedEvents.push(lastItem);
      }
      else {
        if (lastItem) { groupedEvents.push(lastItem); }
        set(e, 'count', 1) // eslint-disable-line
        groupedEvents.push(e);
      }
    });

    return groupedEvents.reverse().slice(0, 20);
  }),

  init() {
    this._super(...arguments);
    this.set('eventsList', A());

    if (this.service) {
      this.addServiceEvents(this.service);
    }
    else if (this.sound) {
      this.addSoundEvents(this.sound);
    }
  },

  willDestroyElement() {
    this._super(...arguments);

    if (this.service) {
      this.removeEvents(this.service);
    }
    if (this.sound) {
      this.removeEvents(this.sound);
    }
  },

  addSoundEvents: function(item) {
    EVENT_MAP.forEach(e => {
      item.on(e.event, (data) => {
        this.eventsList.pushObject({name: e.event, data: data, type: 'sound'})
      });
    });
  },

  addServiceEvents: function(item) {
    this.addSoundEvents(item);

    SERVICE_EVENT_MAP.forEach(e => {
      item.on(e.event, (data) => {
        this.eventsList.pushObject({name: e.event, data: data, type: 'service'})
      });
    });
  },

  removeEvents: function(item) {
    EVENT_MAP.forEach(e => {
      if (item.has(e.event)) {
        item.off(e.event);
      }
    });

    SERVICE_EVENT_MAP.forEach(e => {
      if (item.has(e.event)) {
        item.off(e.event);
      }
    });
  },

  actions: {
    async displayEvent(e) {
      console.log(`name: ${e.name}`); //eslint-disable-line
      console.log(e.data); //eslint-disable-line
    }
  }
});
