/*jshint node:true*/
module.exports = {
  description: '',
  normalizeEntityName: function() {},
  // locals: function(options) {
  //   // Return custom template variables here.
  //   return {
  //     foo: options.entity.options.foo
  //   };
  // }

  afterInstall: function(options) {
    return this.addBowerPackagesToProject([

      {name:"soundmanager", target: "V2.97a.20140901"},
      {name:"ember-cli-soundmanager-shim", target: "^0.0.1"},
      {name: "howler.js", target: "^2.0.0"}
    ]);
  }
};
