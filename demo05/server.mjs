import vueServerRenderer from 'vue-server-renderer';
import fs from 'fs';
import express from 'express';
import { createApp } from './app.mjs';
const server = express();
const template = fs.readFileSync('./template.html', 'utf-8');
const renderer = vueServerRenderer.createRenderer({ template });
// 可以与 Vue 应用程序实例共享 context 对象，允许模板插值中的组件动态地注册数据。
const context = {
    title: 'hello wrold',
    meta: `<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">`,
};
// 提供静态服务器，可以提供浏览器加载app.mjg，vue.esm.mjs，vue-router.esm.mjs
server.use(express.static('./'));
server.get('*', async (req, res) => {
    const { app } = createApp();
    const html = await renderer.renderToString(app, context);
    console.log(html);
    res.end(html);
});

const port = 3000;
server.listen(port, () => console.log(`http://127.0.0.1:${port}`));
