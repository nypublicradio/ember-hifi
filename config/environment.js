'use strict';

const defaultConnections = [
  {name: 'NativeAudio', config: {}},
  {name: 'HLS', config: {}},
  {name: 'Howler', config: {}}
];

module.exports = function(environment, appConfig) {
  appConfig.emberHifi = appConfig.emberHifi || {};
  appConfig.emberHifi.debug = (appConfig.emberHifi.debug === undefined) ? false : appConfig.emberHifi.debug;

  let configConnections = appConfig.emberHifi.connections || [];

  if (configConnections.length === 0) {
    appConfig.emberHifi.connections = defaultConnections;
  }
};
