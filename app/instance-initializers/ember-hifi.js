import config from '../config/environment';

export function initialize(application) {
  const defaultConnections = [
    {name: 'NativeAudio', config: {}},
    {name: 'HLS', config: {}},
    {name: 'Howler', config: {}}
  ];

  const { emberHifi = {
    debug: false,
  } } = config;

  if (emberHifi.connections) {
    // Connections were specified in consumer environment file

    if (emberHifi.connections.length === 0) {
      console.warn('[ember-hifi] No hifi connections were specified, using defaults.');
      emberHifi.connections = defaultConnections;
    }
  }
  else {
    // none were specified, use defaults
    emberHifi.connections = defaultConnections;
  }

  const { environment = 'development' } = config;
  const options = { emberHifi, environment };
  application.register('config:hifi', options, { instantiate: false });
  application.inject('service:hifi', 'options', 'config:hifi');
}

export default {
  name: 'ember-hifi',
  initialize
};
