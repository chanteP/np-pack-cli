module.exports = function(source) {
  // const json = JSON.stringify(source).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `
  const wasmBase64 = "${source.toString('base64')}";
  ${moduleContent
    .toString()
    .split('\n')
    .slice(1, -1)
    .join('\n')}
  `;
};

function moduleContent(source) {
  const blob = base64toBlob(wasmBase64);

  module.exports = function(imports) {
    // TODO imports
    imports = imports || {
      env: {
        abort(_msg, _file, line, column) {
          console.error('abort called at:' + line + ':' + column);
        }
      }
    };
    return Promise.resolve(blob.arrayBuffer())
      .then(buffer => WebAssembly.instantiate(buffer, imports))
      .then(({ instance = {}, module } = {}) => ({ exports: instance.exports, instance, module }));
  };

  function base64toBlob(base64, type) {
    // 将base64转为Unicode规则编码
    (bstr = atob(base64, type)), (n = bstr.length), (u8arr = new Uint8Array(n));
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n); // 转换编码后才可以使用charCodeAt 找到Unicode编码
    }
    return new Blob([u8arr], {
      type
    });
  }
}

// 通过 exports.raw 属性告诉 Webpack 该 Loader 是否需要二进制数据
module.exports.raw = true;
