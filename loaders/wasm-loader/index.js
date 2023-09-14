module.exports = function (source) {
    // const json = JSON.stringify(source).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    return `
  const wasmBase64 = "${source.toString('base64')}";
  ${moduleContent.toString().split('\n').slice(1, -1).join('\n')}
  `;
};

function moduleContent(source) {
    const buffer = base64toBuffer(wasmBase64);

    let handler = undefined;

    function instantiate(imports) {
        imports = imports || {
            env: {
                abort(_msg, _file, line, column) {
                    console.error('abort called at:' + line + ':' + column);
                },
            },
        };

        handler = Promise.resolve(buffer)
            .then((buffer) => WebAssembly.instantiate(buffer, imports))
            .then(({ instance = {}, module } = {}) => ({ exports: instance.exports, instance, module }));
        return handler;
    }
    async function get(name) {
        if (!handler) {
            instantiate();
        }
        return handler.then(({ exports }) => {
            return exports[name];
        });
    }

    module.exports = {
        instantiate,
        get,
    };

    function base64toBuffer(base64, type) {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(base64, 'base64');
        }
        // 将base64转为Unicode规则编码
        (bstr = atob(base64, type)), (n = bstr.length), (u8arr = new Uint8Array(n));
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n); // 转换编码后才可以使用charCodeAt 找到Unicode编码
        }
        return new Blob([u8arr], {
            type,
        }).arrayBuffer();
    }
}

// 通过 exports.raw 属性告诉 Webpack 该 Loader 是否需要二进制数据
module.exports.raw = true;
