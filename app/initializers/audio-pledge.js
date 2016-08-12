import config from '../config/environment';

export function initialize(application) {
  const { audioPledgeFactories = [
  {
    name: 'sound-manager',
    config: {}
  },
  {
    name: 'howler',
    config: {}
  }] } = config;
  const { environment = 'development' } = config;
  const options = { audioPledgeFactories, environment };
  application.register('config:audio-pledge', options, { instantiate: false });
  application.inject('service:audio-pledge', 'options', 'config:audio-pledge');
}

export default {
  name: 'audio-pledge',
  initialize
};
