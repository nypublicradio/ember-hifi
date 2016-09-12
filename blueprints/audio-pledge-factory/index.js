module.exports = {
  description: 'Generates an audio-pledger sound factory.',

  locals: function(options) {
    var importStatement = "import BaseSound from 'audio-pledge/audio-pledge-factories/base';";
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
