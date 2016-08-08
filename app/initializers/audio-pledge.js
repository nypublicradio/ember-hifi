import config from '../config/environment';

export function initialize(application) {
  const { audioAdapters = [] } = config;
  const { environment = 'development' } = config;
  const options = { audioAdapters, environment };

  application.register('config:audio-pledge', options, { instantiate: false });
  application.inject('service:audio-pledge', 'options', 'config:audio-pledge');
}

export default {
  name: 'audio-pledge',
  initialize
};
