// 环境变量：决定入口是客户端还是服务端
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const TARGET_NODE = process.env.WEBPACK_TARGET === 'node';
const target = TARGET_NODE ? 'server' : 'client';
module.exports = {
    lintOnSave: false,
    outputDir: path.join(__dirname, 'dist', target),
    publicPath: './',
    configureWebpack: {
        target: TARGET_NODE ? 'node' : 'web',
        node: TARGET_NODE ? undefined : false,
        entry: `./src/entry-${target}.js`,
        // 对 bundle renderer 提供 source map 支持
        devtool: 'source-map',
        // 此处告知 server bundle 使用 Node 风格导出模块(Node-style exports)
        output: {
            libraryTarget: TARGET_NODE ? 'commonjs2' : undefined,
        },
        externals: TARGET_NODE
            ? nodeExternals({
                  // 不要外置化 webpack 需要处理的依赖模块。
                  // 你可以在这里添加更多的文件类型。例如，未处理 *.vue 原始文件，
                  // 你还应该将修改 `global`（例如 polyfill）的依赖模块列入白名单
                  allowlist: /\.css$/,
              })
            : undefined,
        // 这是将服务器的整个输出
        // 构建为单个 JSON 文件的插件。
        // 默认文件名为 `vue-ssr-server-bundle.json`
        plugins: [
            TARGET_NODE ? new VueSSRServerPlugin() : new VueSSRClientPlugin(),
        ],
        optimization: {
            splitChunks: TARGET_NODE ? false : undefined,
        },
    },
};
