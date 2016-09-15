module.exports = {
  description: 'Generates an ember-hifi connection.',

  locals: function(options) {
    var importStatement = "import BaseSound from 'ember-hifi/hifi-connections/base';";
    var baseClass = 'BaseSound';
    var name      = options.entity.name;
    var toStringExtension = 'return ' + "'" + options.entity.name + "';";
    // Return custom template variables here.
    return {
      importStatement: importStatement,
      baseClass: baseClass,
      name: name,
      toStringExtension: toStringExtension
    };
  }
};
