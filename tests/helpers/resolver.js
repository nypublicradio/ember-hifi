import Resolver from '../../resolver';
import config from '../../config/environment';

const resolver = Resolver.create({
  pluralizedTypes: {
    'audio-pledge-factory': 'audio-pledge-factories'
  }
});

resolver.namespace = {
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix
};

export default resolver;
