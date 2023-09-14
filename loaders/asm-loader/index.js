const ascLoader = import('assemblyscript/dist/asc.js');

module.exports = async function asmLoader(source) {
    const asc = await ascLoader; 
    // TODO options
    const data = await asc.compileString(source, { optimizeLevel: 2 });

    const { binary, text, stdout, stderr } = data;
    if (stderr.length) {
        return this.callback(stderr.toString());
    }
    return Buffer.from(binary);
};
