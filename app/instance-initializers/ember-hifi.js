import config from '../config/environment';

export function initialize(application) {
  const { emberHifi = {
    debug: false,
    connections: [
      {name: 'NativeAudio', config: {}},
      {name: 'HLS', config: {}},
      {name: 'Howler', config: {}}
  ]} } = config;
  const { environment = 'development' } = config;
  const options = { emberHifi, environment };
  application.register('config:hifi', options, { instantiate: false });
  application.inject('service:hifi', 'options', 'config:hifi');
}

export default {
  name: 'ember-hifi',
  initialize
};
