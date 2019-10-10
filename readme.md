# 自用pack

js/ts/vue/images/wasm

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