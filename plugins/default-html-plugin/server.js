const chalk = require('chalk');
const { exec } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const mime = require('mime');

const titleHolder = '${TITLE}';
const scriptSrcHolder = '${PACK_SOURCE}';
const htmlTemplatePath = './template.html';

class Service {
    constructor(port, options) {
        this.template = fs.readFileSync(`${__dirname}/${htmlTemplatePath}`, 'utf8');
        this.port = port;
        this.resources = options.resources;

        const root = process.cwd();
        this.entry = this.parseEntry();

        const entryPath = `/${this.entry}.js`;
        const rootHtml = this.template.replace(titleHolder, this.entry).replace(scriptSrcHolder, entryPath);

        const uaCache = new Map();

        this.server = http.createServer((request, response) => {
            const remoteIP = request.socket.remoteAddress;

            console.log(chalk.gray(`[pack][${remoteIP}]request: ${request.url}`));

            if (!uaCache.has(remoteIP)) {
                const ua = request.headers['user-agent'];
                uaCache.set(remoteIP, ua);
                console.log(chalk.gray(`[pack][${remoteIP}]userAgent: ${ua}`));
            }

            const purePath = request.url?.split('?')[0] ?? '/';
            // const query = request.url
            const requestPath = path.join('/', purePath);

            const type = mime.getType(requestPath);
            type && response.setHeader('content-type', type);

            // localhost policy setting
            response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

            try {
                switch (true) {
                    case requestPath === '/favicon.ico':
                        response.write('');
                        break;
                    case requestPath === entryPath:
                        response.write(this.resources.get(this.entry));
                        break;
                    case this.resources.has(requestPath):
                        response.write(this.resources.get(requestPath));
                        break;
                    case requestPath === '/':
                        response.write(rootHtml);
                        break;
                    default:
                        // static
                        response.write(fs.readFileSync(`${root}${requestPath}`));
                        break;
                }
            } catch (e) {
                response.statusCode = 404;
                console.error(chalk.red(`dev service error: `, e));
            }
            response.end();
        });
    }

    listen(callback) {
        this.server.listen(this.port, callback);
    }

    parseEntry() {
        for (let [name, content] of this.resources) {
            return name;
        }
    }

    openBrowser() {
        const host = `http://${getLocalIP()}:${this.port}/`;
        console.log(chalk.cyan(`dev service: ${host}`));
        exec(`open ${host}`);
    }

    // TODO 可能也不会todo，手动刷多好
    update() {}
}

function getLocalIP() {
    const networkInterfaces = os.networkInterfaces();
    const arr = networkInterfaces.en0?.find((link) => link.family === 'IPv4');
    return arr?.address || 'localhost';
}

module.exports = Service;
