# 自用 pack

js/ts/vue/images/wasm

```
Examples:
 pack ./somePath/index.ts
 pack ./somePath/index.ts --html
 pack ./somePath/index.ts -o ./dist/file.html
 pack ./somePath/index.ts -o ./dist/[name].[chunkhash].js
 pack ./somePath/index.ts -o ./dist/[name].[chunkhash].js --analyze


Usage: pack [options]

Options:
  -s, --source <src>         source file path
  -o, --output <output>      output file path (default: "./.temp/[name].[chunkhash].js")
  -w, --watch                watch (default: false)
  --polyfill                 use polyfill (default: false)
  --html [port]              preview in html without output. default port: 9999 (default: false)
  --analyze                  use webpack-bundle-analyzer (default: false)
  --target <target>          target (default: "web")
  --mode <mode>              mode (default: "development")
  --alias <alias>            resolve.alias (default: "")
  --extensions <extensions>  extensions with url-loader, --extensions .wav,.mp3  (default: ".wav,.mp3")
  --files <files>            extensions with file-loader, --files .node  (default: ".node")
  --raw <raw>                extensions with raw-loader, --raw .txt,.md  (default: ".txt,.md")
  --sourcemap <sourcemap>    sourcemap, default@development:cheap-module-eval-source-map; @production:'' (default:"auto")
  -h, --help                 output usage information
```

## asm(ts)/wasm

asm-loader: ts to wasm
wasm-loader: wasm buffer to promise

add.asm

```
export function add(a: i32, b: i32): i32 {
  return a + b;
}
```

entry.js

```
import mod from './add.asm';
//import mod from './add.wasm';
mod().then(({ exports: { add } }) => {
  console.log(add(3, 4));
});
```

or

```
import { get } from './fib.asm';

const fib = await get('fib');
fib?.(40);
```
