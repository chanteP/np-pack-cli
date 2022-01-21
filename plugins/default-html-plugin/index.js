const service = require('./server');

class DefaultHtmlPlugin {
    constructor({ port }) {
        this.port = port;

        this.fileContentMap = new Map;
    }

    // private
    updateResources(compilation) {

        for (const [name, entry] of compilation.entrypoints) {
            const assetName = entry.getFiles();
            if (assetName && assetName.length) {
                this.fileContentMap.set(name, compilation.assets[assetName[0]].source());
            }
        }

    }

    callService(){
        this.server = new service(this.port, {
            resources: this.fileContentMap,
        });

        this.server.listen(() => {
            try{
                this.server.openBrowser();
            }catch{
            }
        });

    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('emit', (compilation, callback) => {

            this.updateResources(compilation);


            compilation.assets = {};
            
            if(!this.server){
                this.callService();
            }

            this.server.update();

            callback();
        });
    }
}

module.exports = DefaultHtmlPlugin;
