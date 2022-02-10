import chalk from 'chalk';
import { exec } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';

const titleHolder = '${TITLE}';
const scriptSrcHolder = '${PACK_SOURCE}';
const htmlTemplatePath = './template.html';

export class Service {
    private template:string;
    private port: number;
    private resources: Map<string, any>;
    private entry: string;
    server: http.Server;

    constructor(port, options) {
        this.template = fs.readFileSync(`${__dirname}/${htmlTemplatePath}`, 'utf8');
        this.port = port;
        this.resources = options.resources;

        this.entry = this.parseEntry();

        const entryPath = `/${this.entry}.js`;
        const rootHtml = this.template.replace(titleHolder, this.entry).replace(scriptSrcHolder, entryPath);

        this.server = http.createServer((request, response) => {
            try {
                switch (request.url) {
                    case entryPath:
                        response.write(this.resources.get(this.entry));
                        break;
                    case '/':
                        response.write(rootHtml);
                        break;
                }
            } catch (e) {
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
