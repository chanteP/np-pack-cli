#!/usr/bin/env node
const path = require('path');
const webpack = require('webpack');
const chalk = require('chalk');
const program = require('commander');

const VueLoaderPlugin = require('vue-loader/lib/plugin');

const cwd = process.cwd();

program
    .option('-s, --source <src>', 'source file path')
    .option('-o, --output <output>', 'output file path', `./temp/_$$.[hash].js`)
    .option('-w, --watch', 'watch', false)
    .option('--mode <mode>', 'mode, default to development', 'development')
    .option('--extensions <extensions>', 'add other extensions with url-loader, --extensions .wav,.mp3 ', '')
program.parse(process.argv);
program.source = program.source || program.args[0];
if (!program.source) {
    program.outputHelp((txt) => chalk.gray(txt));
    process.exit(1);
}

const config = getConfig(program);
console.log([
    chalk.grey('==================='),
    chalk.grey(`mode\t: ${config.mode} `),
    chalk.grey(`isWatch\t: ${config.watch} `),
    chalk.grey(`source\t: ${config.entry} `),
    chalk.grey(`output\t: ${path.resolve(config.output.path, config.output.filename)} `),
    chalk.grey('==================='),
].join('\n'));

console.time('build');
webpack(config, (err, stats) => { // Stats Object
    if (err || stats.hasErrors()) {
        // Handle errors here
        console.log(chalk.red('Error!!!'));
        console.error(err || stats.toString());
    }
    // Done processing
    console.log(program.watch ?
        chalk.cyan('big brother is watching you') :
        chalk.green('done')
    );
    console.timeEnd('build');
});

// config
function getConfig({ source, output, watch, mode, extensions }) {
    return {
        mode,
        watch,
        entry: path.resolve(cwd, source),
        output: {
            path: path.join(cwd, './'),
            filename: output
        },

        module: {
            rules: [
                {
                    test: /\.(js|mjs|ts)$/,
                    loader: 'babel-loader',
                    exclude: path.resolve(cwd, '/node_modules'),
                    options: {
                        presets: ['@babel/env', '@babel/preset-typescript']
                    }
                },
                {
                    test: /\.(jsx)$/,
                    loader: 'babel-loader',
                    exclude: path.resolve(cwd, '/node_modules'),
                    options: {
                        presets: ['@babel/env', '@babel/preset-react']
                    }
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
                    test: /\.(jpe?g|png|gif|svg)$/,
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                    }
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)$/,
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                    }
                },
                {
                  test: /\.wasm$/,
                  loaders: ['wasm-loader']
                },
                ...(extensions ? [{
                    test: new RegExp(`\.(${extensions.replace(/\./g, '').replace(',', '|')})$`),
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                    }
                }] : [])
            ]
        },
        plugins: [
            new VueLoaderPlugin(),
        ],
        resolve: {
            extensions: ['.js', '.mjs', '.ts', '.vue', '.jsx', '.wasm', ...(extensions && extensions.split(',') || [])]
        },
    }
}