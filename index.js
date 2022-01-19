#!/usr/bin/env node
const path = require('path');
const webpack = require('webpack');
const chalk = require('chalk');
const program = require('commander');

// plugins ----------------------------------------
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const DefaultHtmlPlugin = require('./plugins/default-html-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');
const packageJson = require('./package.json');

const babelCommonPresetEnv = [
    getLocalDependency('@babel/preset-env'),
    {
        modules: false,
        useBuiltIns: 'entry',
        corejs: 3,
        targets: "last 2 versions, not dead",
    },
];

// 开启polyfill后使用
const babelCommonPlugins = [
    getLocalDependency('@babel/plugin-proposal-optional-chaining'),
    getLocalDependency('@babel/plugin-proposal-nullish-coalescing-operator'),
    [
        getLocalDependency('@babel/plugin-proposal-decorators'),
        {
            legacy: true,
        },
    ],
    [
        getLocalDependency('@babel/plugin-proposal-class-properties'),
        {
            loose: true,
        },
    ],
    getLocalDependency('@babel/plugin-proposal-function-sent'),
    getLocalDependency('@babel/plugin-proposal-export-namespace-from'),
    getLocalDependency('@babel/plugin-proposal-numeric-separator'),
    getLocalDependency('@babel/plugin-proposal-throw-expressions'),
];
// const
const cwd = process.cwd();

// command
program
    .option('-s, --source <src>', 'source file path')
    .option('-o, --output <output>', 'output file path', `./.temp/[name].[chunkhash].js`)
    .option('-w, --watch', 'watch', false)
    .option('--polyfill', 'use polyfill', false)
    .option('--html [port]', 'preview in html without output. default port: 9999', false)
    .option('--analize', 'use webpack-bundle-analyzer', false)
    .option('--target <target>', 'target', 'web')
    .option('--mode <mode>', 'mode', 'development')
    .option('--extensions <extensions>', 'extensions with url-loader, --extensions .wav,.mp3 ', '.wav,.mp3')
    .option('--raw <raw>', 'extensions with raw-loader, --raw .txt,.md ', '.txt,.md')
    .option('--sourcemap <sourcemap>', "sourcemap, default@development:cheap-module-eval-source-map; @production:''", 'auto')
    ;

program.parse(process.argv);
program.source = program.source || program.args[0];

// TODO list support
if (!program.source) {
    console.log(chalk.gray('version: ', packageJson.version));

    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray(' pack ./somePath/index.ts'));
    console.log(chalk.gray(' pack ./somePath/index.ts --html'));
    console.log(chalk.gray(' pack ./somePath/index.ts -o ./dist/[name].[chunkhash].js'));
    console.log(chalk.gray(' pack ./somePath/index.ts -o ./dist/[name].[chunkhash].js --analize'));

    console.log('\n');

    program.outputHelp(txt => chalk.gray(txt));

    process.exit(1);
}

program.watch = program.watch || !!program.html;
program.html = program.analize ? null : program.html;
program.html = program.html ? /^\d+$/.test(program.html + '') ? +program.html : 9999 : null;

const config = getConfig(program);


console.log(
    [
        chalk.grey('==================='),
        chalk.grey(`mode     \t: ${config.mode} `),
        chalk.grey(`isWatch  \t: ${config.watch} `),
        chalk.grey(`polyfill \t: ${program.polyfill} `),
        chalk.grey(`source   \t: ${program.source} `),
        chalk.grey(`output   \t: ${path.resolve(config.output.path, config.output.filename)} `),
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
function getConfig({ source, output, watch, mode, extensions, sourcemap, analize, polyfill, html, raw }) {
    const babelPlugins = polyfill ? babelCommonPlugins : [];
    const polyfillEntryInset = polyfill ? [
        getLocalDependency('core-js/stable'),
        getLocalDependency('reflect-metadata'),
    ] : [];

    return {
        mode,
        watch,
        devtool: sourcemap === 'auto' ? (mode === 'development' && 'cheap-module-eval-source-map') || '' : sourcemap,
        entry: {
            [path.basename(source, '.js')]: [
                ...polyfillEntryInset,
                path.resolve(cwd, source),
            ],
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
                        presets: [babelCommonPresetEnv, getLocalDependency('@babel/preset-typescript')],
                        plugins: babelPlugins,
                    },
                },
                // { test: /\.tsx$/, loader: 'babel-loader!ts-loader', options: { appendTsxSuffixTo: [/TSX\.vue$/] } },
                {
                    test: /\.tsx$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [babelCommonPresetEnv],
                                plugins: babelPlugins,
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
                        presets: [babelCommonPresetEnv],
                        plugins: babelPlugins,
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
                {
                    test: new RegExp(`\.(${raw.replace(/\./g, '').replace(',', '|')})$`, 'i'),
                    loader: 'raw-loader',
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                __DEV__: JSON.stringify(mode),
                'process.env': {},
            }),
            new VueLoaderPlugin(),
            analize && new BundleAnalyzerPlugin({
                analyzerPort: 0,
            }),
            html && new DefaultHtmlPlugin({ port: html }),
        ].filter(d => !!d),
        resolve: {
            extensions: ['.js', '.ts', '.mjs', '.vue', '.jsx', '.tsx', '.wasm'],
        },
        resolveLoader: {
            modules: [getLocal('./loaders/'), getLocal('./node_modules'), getLocal('../../node_modules'), 'node_modules'],
        },
        optimization: {
            mangleWasmImports: true,
            minimizer: [
                mode === 'production' && new TerserPlugin({
                    extractComments: false,
                    parallel: true,
                    terserOptions: {
                        compress: {
                            // pure_funcs: isRelease ? ['console.log', 'console.info'] : [],
                        },
                        output: {
                            comments: false,
                        },
                        safari10: true,
                    },
                }),
            ].filter(d => !!d),
        },
        target: program.target,
    };
}

function getLocal(moduleName) {
    return path.resolve(__dirname, moduleName);
}

function getLocalDependency(moduleName) {
    return require.resolve(moduleName);
}
