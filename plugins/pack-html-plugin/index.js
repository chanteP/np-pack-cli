const { join, resolve, basename, dirname, normalize } = require('path');
const fs = require('fs');

const titleHolder = '${TITLE}';
const scriptSrcHolder = '<script src="${PACK_SOURCE}"></script>';
const htmlTemplatePath = resolve(__dirname, '../default-html-plugin/template.html');

class DefaultHtmlPlugin {
    constructor(options) {
        this.htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');
        this.output = options.output;
    }

    compileHtml(p, data) {
        const html = this.htmlTemplate;
        return html.replace(titleHolder, basename(p)).replace(scriptSrcHolder, (match) => {
            return `<script>${data}</script>`;
        });
    }

    apply(compiler) {
        const outputPath = normalize(dirname(this.output));

        compiler.hooks.emit.tapAsync('emit', (compilation, callback) => {
            // this.updateResources(compilation);

            const resultMap = {};

            Object.entries(compilation.assets).forEach(([p, data]) => {
                if (p.endsWith('.html')) {
                    resultMap[p] = this.compileHtml(p, data.source());
                } else {
                    const fixPath = p.replace(outputPath, '');
                    resultMap[fixPath] = data.source();
                }
            });

            compilation.assets = {};

            Object.entries(resultMap).forEach(([filePath, data]) => {
                compilation.assets[filePath] = {
                    source: () => data,
                };
            });

            callback();
        });
    }
}

module.exports = DefaultHtmlPlugin;
