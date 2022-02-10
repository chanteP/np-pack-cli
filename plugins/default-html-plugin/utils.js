const { resolve } = require('path');

const vueEntryHolder = '@np/pack-cli/vueholder';

module.exports = {
    vueEntryHolder,

    vueEntryTemplatePath: resolve(__dirname, './vueEntry.js'),
};
