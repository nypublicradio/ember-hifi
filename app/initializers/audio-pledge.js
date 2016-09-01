import config from '../config/environment';
import Resolver from 'ember-resolver';

Resolver.reopen({
  pluralizedTypes: {
    'audio-pledge-factory': 'audio-pledge-factories'
  }
});

export function initialize(application) {
  const { audioPledgeFactories = [
    {
      name: 'HLS',
      config: {}
    },
    {
      name: 'Howler',
      config: {}
    },
    {
      name: 'SoundManager',
      config: {}
    }
  ] } = config;
  const { environment = 'development' } = config;
  const options = { audioPledgeFactories, environment };
  application.register('config:audio-pledge', options, { instantiate: false });
  application.inject('service:audio-pledge', 'options', 'config:audio-pledge');
}

export default {
  name: 'audio-pledge',
  initialize
};
