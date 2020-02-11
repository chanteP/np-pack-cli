#!/usr/bin/env node
const path = require('path');
const webpack = require('webpack');
const chalk = require('chalk');
const program = require('commander');
require('babel-polyfill');
// plugins
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const babelCommonPlugins = [
    require.resolve('@babel/plugin-proposal-optional-chaining'),
    require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
    [
        require.resolve('@babel/plugin-proposal-decorators'),
        {
            legacy: true,
        },
    ],
    [
        require.resolve('@babel/plugin-proposal-class-properties'),
        {
            loose: true,
        },
    ],
    require.resolve('@babel/plugin-proposal-function-sent'),
    require.resolve('@babel/plugin-proposal-export-namespace-from'),
    require.resolve('@babel/plugin-proposal-numeric-separator'),
    require.resolve('@babel/plugin-proposal-throw-expressions'),
];
// const
const cwd = process.cwd();

// command
program
    .option('-s, --source <src>', 'source file path')
    .option('-o, --output <output>', 'output file path', `./temp/[name].[chunkhash].js`)
    .option('-w, --watch', 'watch', false)
    .option('--target <target>', 'target', 'web')
    .option('--mode <mode>', 'mode', 'development')
    .option('--sourcemap <sourcemap>', "sourcemap, development:cheap-module-eval-source-map, production:''", 'auto')
    .option('--extensions <extensions>', 'add other extensions with url-loader, --extensions .wav,.mp3 ', '.wav,.mp3');
program.parse(process.argv);
program.source = program.source || program.args[0];
// TODO list support
if (!program.source) {
    program.outputHelp(txt => chalk.gray(txt));
    process.exit(1);
}

const config = getConfig(program);
console.log(
    [
        chalk.grey('==================='),
        chalk.grey(`mode\t: ${config.mode} `),
        chalk.grey(`isWatch\t: ${config.watch} `),
        chalk.grey(`source\t: ${program.source} `),
        chalk.grey(`output\t: ${path.resolve(config.output.path, config.output.filename)} `),
        chalk.grey('==================='),
    ].join('\n'),
);

webpack(config, (err, stats) => {
    const message = stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
    });
    if (err || stats.hasErrors()) {
        console.error(err ? chalk.red(err) : message);
        return;
    }
    console.log(message);
    console.log(chalk.grey('==================='));
    console.log(program.watch ? chalk.cyan('big brother is watching you') : chalk.green('done'));
});

// config
function getConfig({ source, output, watch, mode, extensions, sourcemap }) {
    return {
        mode,
        watch,
        devtool: sourcemap === 'auto' ? (mode === 'development' && 'cheap-module-eval-source-map') || '' : sourcemap,
        entry: {
            [path.basename(source, '.js')]: [require.resolve('babel-polyfill'), path.resolve(cwd, source)],
        },
        output: {
            path: path.join(cwd, './'),
            filename: output,
        },
        module: {
            defaultRules: [
                {
                    type: 'javascript/auto',
                    resolve: {},
                },
                {
                    test: /\.json$/i,
                    type: 'json',
                },
                // 去除了wasm的处理
            ],

            rules: [
                {
                    test: /\.(js|mjs|ts)$/,
                    loader: 'babel-loader',
                    exclude: path.resolve(cwd, '/node_modules'),
                    options: {
                        presets: [require.resolve('@babel/preset-env'), require.resolve('@babel/preset-typescript')],
                        plugins: babelCommonPlugins,
                    },
                },
                // { test: /\.tsx$/, loader: 'babel-loader!ts-loader', options: { appendTsxSuffixTo: [/TSX\.vue$/] } },
                {
                    test: /\.tsx$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [require.resolve('@babel/preset-env')],
                                plugins: babelCommonPlugins,
                            },
                        },
                        {
                            loader: 'ts-loader',
                            options: {
                                appendTsxSuffixTo: [/TSX\.vue$/],
                            },
                        },
                    ],
                },
                {
                    test: /\.(jsx)$/,
                    loader: 'babel-loader',
                    exclude: path.resolve(cwd, '/node_modules'),
                    options: {
                        presets: [require.resolve('@babel/preset-env')],
                        plugins: babelCommonPlugins,
                    },
                },
                {
                    test: /\.(vue)$/,
                    loader: 'vue-loader',
                },
                {
                    test: /\.(css|scss|sass)$/,
                    use: [
                        // Creates `style` nodes from JS strings
                        'style-loader',
                        // Translates CSS into CommonJS
                        'css-loader',
                        // Compiles Sass to CSS
                        'sass-loader',
                    ],
                },
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 10000,
                            },
                        },
                    ],
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)$/i,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 10000,
                            },
                        },
                    ],
                },
                {
                    test: /\.wasm$/,
                    loader: 'wasm-loader',
                },
                {
                    test: /\.asm$/,
                    use: [
                        // wasm to promise
                        'wasm-loader',
                        // asm to wasm
                        'asm-loader',
                    ],
                },
                {
                    test: new RegExp(`\.(${extensions.replace(/\./g, '').replace(',', '|')})$`, 'i'),
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                    },
                },
            ],
        },
        plugins: [new VueLoaderPlugin()],
        resolve: {
            extensions: ['.js', '.ts', '.mjs', '.vue', '.jsx', '.tsx', '.wasm', ...extensions.split(',')],
        },
        resolveLoader: {
            modules: [getLocal('./loaders/'), getLocal('./node_modules'), 'node_modules'],
        },
        optimization: {
            mangleWasmImports: true,
        },
        target: program.target,
    };
}

function getLocal(moduleName) {
    return path.resolve(__dirname, moduleName);
}
