#!/usr/bin/env node
const { existsSync } = require('fs');
const { resolve, basename, join } = require('path');
const webpack = require('webpack');
const chalk = require('chalk');
const program = require('commander');

// plugins ----------------------------------------
const VueLoaderPlugin = require('vue-loader/dist/pluginWebpack5').default;
const DefaultHtmlPlugin = require('./plugins/default-html-plugin');
const { vueEntryHolder, vueEntryTemplatePath } = require('./plugins/default-html-plugin/utils');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

const packageJson = require('./package.json');

const babelCommonPresetEnv = [
    getLocalDependency('@babel/preset-env'),
    {
        modules: false,
        useBuiltIns: 'entry',
        corejs: 3,
        targets: 'last 2 versions, not dead',
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
    .option('--alias <alias>', 'resolve.alias', '')
    .option('--extensions <extensions>', 'extensions with url-loader, --extensions .wav,.mp3 ', '.wav,.mp3')
    .option('--files <files>', 'extensions with file-loader, --files .node ', '.node')
    .option('--raw <raw>', 'extensions with raw-loader, --raw .txt,.md ', '.txt,.md')
    .option(
        '--sourcemap <sourcemap>',
        "sourcemap, default@development:cheap-module-eval-source-map; @production:''",
        'auto',
    );

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

    program.outputHelp((txt) => chalk.gray(txt));

    process.exit(1);
}

program.watch = program.watch || !!program.html;
program.html = program.analize ? null : program.html;
program.html = program.html ? (/^\d+$/.test(program.html + '') ? +program.html : 9999) : null;

const config = getConfig(program);

console.log(
    [
        chalk.grey('==================='),
        chalk.gray(`version  \t: ${packageJson.version}`),
        chalk.grey('==================='),
        chalk.grey(`mode     \t: ${config.mode} `),
        chalk.grey(`isWatch  \t: ${config.watch} `),
        chalk.grey(`polyfill \t: ${program.polyfill} `),
        chalk.grey(`source   \t: ${program.source} `),
        chalk.grey(`output   \t: ${program.html ? 'memory' : resolve(config.output.path, config.output.filename)} `),
        chalk.grey('==================='),
    ].join('\n'),
);

webpack(config, (err, stats) => {
    if (err) {
        console.error(chalk.red(err));
        return;
    }
    const message = stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
    });

    if (stats.hasErrors()) {
        console.error(chalk.red(message));
        return;
    }
    console.log(message);
    console.log(chalk.grey('==================='));
    console.log(program.watch ? chalk.cyan('big brother is watching you') : chalk.green('done'));
});

// config
function getConfig({ source, output, watch, mode, extensions, sourcemap, analize, polyfill, html, raw, files, alias }) {
    const babelPlugins = polyfill ? babelCommonPlugins : [];
    const polyfillEntryInset = polyfill
        ? [getLocalDependency('core-js/stable'), getLocalDependency('reflect-metadata')]
        : [];

    const tsConfigFile = existsSync(resolve(cwd, './tsconfig.json'))
        ? resolve(cwd, './tsconfig.json')
        : resolve(__dirname, './tsconfig.json');

    const extraAlias = alias ? JSON.parse(alias) : {};

    const useVueEntryTemplate = source.endsWith('.vue') && html;
    const entry = useVueEntryTemplate ? vueEntryTemplatePath : resolve(cwd, source);
    const vueEntryAlias = useVueEntryTemplate
        ? {
              [vueEntryHolder]: resolve(cwd, source),
          }
        : {};

    return {
        mode,
        watch,
        devtool: sourcemap === 'auto' ? (mode === 'development' && 'eval-cheap-module-source-map') || '' : sourcemap,
        entry: {
            [basename(source, '.js')]: [getLocalDependency('regenerator-runtime/runtime'), ...polyfillEntryInset, entry],
        },
        output: {
            path: join(cwd, './'),
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
                    test: /\.(vue)$/,
                    loader: 'vue-loader',
                },
                {
                    test: /\.(js|mjs|ts)$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [babelCommonPresetEnv, getLocalDependency('@babel/preset-typescript')],
                                plugins: babelPlugins,
                            },
                        },
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: tsConfigFile,
                                appendTsSuffixTo: [/\.vue$/],
                                transpileOnly: true,
                            },
                        },
                    ],
                    exclude: resolve(cwd, '/node_modules'),
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
                    exclude: resolve(cwd, '/node_modules'),
                    options: {
                        presets: [babelCommonPresetEnv],
                        plugins: babelPlugins,
                    },
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
                    options: {
                        limit: 8192,
                    },
                },
                {
                    test: new RegExp(`\.(${files.replace(/\./g, '').replace(',', '|')})$`, 'i'),
                    loader: 'file-loader',
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
            analize &&
                new BundleAnalyzerPlugin({
                    analyzerPort: 0,
                }),
            html && new DefaultHtmlPlugin({ port: html }),
        ].filter((d) => !!d),
        resolve: {
            alias: {
                ...vueEntryAlias,
                ...extraAlias,
            },
            extensions: ['.js', '.ts', '.mjs', '.vue', '.jsx', '.tsx', '.wasm'],
            modules: [resolve(cwd, './node_modules')],
        },
        resolveLoader: {
            modules: [
                getLocal('./loaders/'),
                getLocal('./node_modules'),
                getLocal('../../node_modules'),
                'node_modules',
            ],
        },
        optimization: {
            mangleWasmImports: true,
            minimizer: [
                mode === 'production' &&
                    new TerserPlugin({
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
            ].filter((d) => !!d),
        },
        target: program.target,
    };
}

function getLocal(moduleName) {
    return resolve(__dirname, moduleName);
}

function getLocalDependency(moduleName) {
    return require.resolve(moduleName);
}
