import { resolve } from 'path';
import { ensureFilePath, writeFileSync } from 'fs-extra';

const tempPath = resolve(__dirname, '../../temp');
export function buildVueEntry(entry) {
    const template = `
        import App from '${entry}';
        import { createApp } from 'vue';

        const div = document.createElement('div');
        div.id = 'app';
        document.body.appendChild(div);

        createApp({
            router,
            render: () => h(App),
        }).mount('#app');
        `;

    const filePath = `${tempPath}/vue/${entry}.${Date.now()}.ts`;
    ensureFilePath(filePath);
    writeFileSync(filePath, template);
    return filePath;
}
