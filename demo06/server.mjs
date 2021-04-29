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
server.use(express.static('./'));
server.get('*', async (req, res) => {
    const matchApp = context => {
        // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
        // 以便服务器能够等待所有的内容在渲染前，
        // 就已经准备就绪。
        return new Promise((resolve, reject) => {
            const { app, router } = createApp()

            // 设置服务器端 router 的位置
            router.push(context.url);

            // 等到 router 将可能的异步组件和钩子函数解析完
            router.onReady(() => {
                const matchedComponents = router.getMatchedComponents()
                // 匹配不到的路由，执行 reject 函数，并返回 404
                if (!matchedComponents.length) {
                    return reject({ code: 404 })
                }

                // Promise 应该 resolve 应用程序实例，以便它可以渲染
                resolve(app)
            }, reject)
        })
    }
    context.url = req.url;
    const app = await matchApp(context);
    const html = await renderer.renderToString(app, context);
    res.end(html);  
});

const port = 3000;
server.listen(port, () => console.log(`http://127.0.0.1:${port}`));
