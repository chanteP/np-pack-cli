class DefaultRawPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapAsync('FileListPlugin', (compilation, callback) => {
            // debugger
            compilation
            callback();
        });
    }
}

module.exports = DefaultRawPlugin;
