const chalk = require('chalk');
const { exec } = require('child_process');
const fs = require('fs-extra');
const http = require('http');
const os = require('os');
const path = require('path');
const mime = require('mime');

const titleHolder = '${TITLE}';
const scriptSrcHolder = '${PACK_SOURCE}';
const htmlTemplatePath = './template.html';
const localUAMapPath = './userAgent';

class Service {
    constructor(port, options) {
        this.template = fs.readFileSync(`${__dirname}/${htmlTemplatePath}`, 'utf8');
        this.uaFile = path.resolve(`${__dirname}/${localUAMapPath}`);
        console.log(chalk.gray(`userAgent log@ ${this.uaFile}`))
        fs.ensureFileSync(this.uaFile);

        this.port = port;
        this.resources = options.resources;

        const root = process.cwd();
        this.entry = this.parseEntry();

        const entryPath = `/${this.entry}.js`;
        const rootHtml = this.template.replace(titleHolder, this.entry).replace(scriptSrcHolder, entryPath);

        this.server = http.createServer((request, response) => {
            const remoteIP = request.socket.remoteAddress;

            this.catchUserAgent(remoteIP, request);
            console.log(chalk.gray(`[pack][${new Date().toLocaleTimeString()}][${remoteIP}]request: ${request.url}`));

            const purePath = request.url?.split('?')[0] ?? '/';
            // const query = request.url
            const requestPath = path.join('/', purePath);

            const type = mime.getType(requestPath);
            type && response.setHeader('content-type', type);

            if(!this.isUnsafe(request.headers.host)){
                // localhost policy setting
                response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            }

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
                    case requestPath === '/etc/passwd':
                        // 内网sb扫端口用
                        response.write('shabiFUCKYOU');
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

    catchUserAgent(remoteIP, request) {
        this.uaCache = this.uaCache || new Map();
        
        if (!this.uaCache.has(remoteIP)) {
            const ua = request.headers['user-agent'];
            this.uaCache.set(remoteIP, ua);
            console.log(chalk.gray(`[pack][${remoteIP}]userAgent: ${ua}`));

            fs.appendFile(this.uaFile, `[${new Date().toLocaleString()}][${remoteIP}] ${ua} \n`);
        }
    }

    isUnsafe(host) {
        return /([\d]+\.){3}[\d]+(:[\d]+)?/.test(host);
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
        const localhost = `http://localhost:${this.port}/`;
        console.log(chalk.cyan(`dev service: ${host}`));
        console.log(chalk.cyan(`           : ${localhost}`));
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
