import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('sound-objects');
  this.route('hifi-service');
  this.route('audio-connections');
  this.route('advanced-usage');
});

export default Router;
