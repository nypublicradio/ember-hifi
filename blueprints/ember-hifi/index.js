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
      {name:"hls.js", target: "^0.6.1"},
      {name: "howler.js", target: "^2.0.0"}
    ]);
  }
};
