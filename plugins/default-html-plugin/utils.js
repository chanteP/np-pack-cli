const { resolve } = require('path');
const { ensureFileSync, writeFileSync } = require('fs-extra');

const tempPath = resolve(__dirname, '../../temp');
module.exports = {
    buildVueEntry(entry) {
        const template = `
        import App from '${entry}';
        import { createApp } from 'vue';

        const div = document.createElement('div');
        div.id = 'app';
        document.body.appendChild(div);

        createApp(App).mount('#app');
        `;

        const filePath = `${tempPath}/vue/${entry}.${Date.now()}.ts`;
        ensureFileSync(filePath);
        writeFileSync(filePath, template);
        return filePath;
    },
};
