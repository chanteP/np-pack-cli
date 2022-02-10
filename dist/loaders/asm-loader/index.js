const asc = require('assemblyscript/cli/asc');

module.exports = function(source) {
  // TODO options
  const { binary, text, stdout, stderr } = asc.compileString(source, { optimizeLevel: 2 });
  if(stderr.length){
    return this.callback(stderr.toString());
  }
  return Buffer.from(binary);
};
