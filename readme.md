## 0、写在前面
vue的文档已经写的很好了，但是官方文档的例子涉及webpack的打包，使得我们对vue-ssr的实现细节理解起来变得困难，因此小编根据自己学习的经验，总结了这篇关于vue-ssr的文章，和[官方文档](https://ssr.vuejs.org/zh/guide/#%E5%AE%89%E8%A3%85)互为补充。文章主要涉及三个方面：
- 实现服务端渲染
- 不使用webpack实现完整的服务端渲染栗子，理解vue-ssr的细节;
- 使用webpack打包，应用于实际生产；

特别说明：
(1) 为了抓住内容的主干，代码中的例子没有加入错误处理。
(2) 安装包和环境说明。
```
"node":"12.13.1",
"express": "^4.17.1",
"vue": "^2.6.12",
"vue-router": "^3.5.1",
"vue-server-renderer": "^2.6.12"
```


## 1、为什么使用服务器端渲染 (SSR)？
- 更好的 SEO，由于搜索引擎爬虫抓取工具可以直接查看完全渲染的页面；
- 快的内容到达时间 (time-to-content)，特别是对于缓慢的网络情况或运行缓慢的设备；

## 2、将vue实例转化为HTML字符串
源码：[demo01](https://github.com/yanguoliang/vue-ssr/tree/main/demo01)
```
// server.js
// 第 1 步：创建一个 Vue 实例
const Vue = require('vue');
const app = new Vue({
    template:`<div>hello world</div>`
});

// 第 2 步：创建一个 renderer
const renderer = require('vue-server-renderer').createRenderer();

// 第 3 步：将 Vue 实例渲染为 HTML
const html = await renderer.renderToString(app);
// html结果为字符串：<div data-server-rendered="true">hello world</div>
```
## 3、使用express搭建node服务
### 3.1 配合express
源码：[demo02](https://github.com/yanguoliang/vue-ssr/tree/main/demo02)
```
const Vue = require('vue');
const server = require('express')();
const renderer = require('vue-server-renderer').createRenderer();
server.get('*', async (req, res) => {
    const app = new Vue({
        template:`<div>hello world</div>`
    });
    const html = await renderer.renderToString(app);
    res.end(`
        <!DOCTYPE html>
        <html lang="en">
            <head><title>Hello</title></head>
            <body>${html}</body>
        </html>
    `)
});
const port = 3000;
server.listen(port, () => console.log(`http://127.0.0.1:${port}`));
```
运行node server.js, 访问http://127.0.0.1:3000, 就可以得到访问结果。
### 3.2 使用模板
源码：[demo02](https://github.com/yanguoliang/vue-ssr/tree/main/demo03)
```
// server.js
const Vue = require('vue');
const fs = require('fs');
const server = require('express')();
// 读取模板
const template = fs.readFileSync('./template.html', 'utf-8');
const { createRenderer } = require('vue-server-renderer');
// 生成带有模板的渲染器
const renderer = createRenderer({ template });
server.get('*', async (req, res) => {
    const app = new Vue({
        template:`<div>hello world</div>`
    });
    const html = await renderer.renderToString(app);
    res.end(html);
});
const port = 3000;
server.listen(port, () => console.log(`http://127.0.0.1:${port}`));
```
```
// template.html
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Hello</title>
    </head>
    <body>
        <!--vue-ssr-outlet-->
    </body>
</html>
```
这个栗子的效果和3.1一样，只是使用了带有template模板的渲染器。

### 3.3 
源码：[demo04](https://github.com/yanguoliang/vue-ssr/tree/main/demo04)
```
// temelate.html
<html>
  <head>
    <!-- 使用双花括号(double-mustache)进行 HTML 转义插值(HTML-escaped interpolation) -->
    <title>{{ title }}</title>

    <!-- 使用三花括号(triple-mustache)进行 HTML 不转义插值(non-HTML-escaped interpolation) -->
    {{{ meta }}}
  </head>
  <body>
    <!--vue-ssr-outlet-->
  </body>
</html>
```
```
const Vue = require('vue');
const fs = require('fs');
const server = require('express')();
// 读取模板
const template = fs.readFileSync('./template.html', 'utf-8');
const { createRenderer } = require('vue-server-renderer');
// 生成带有模板的渲染器
const renderer = createRenderer({ template });

const context = {
    title: 'ssr',
    meta: `<meta charset="utf-8">`,
};

server.get('*', async (req, res) => {
    const app = new Vue({
        template: `<div>hello {{str}}</div>`,
        data(){
            return {
                str: req.url
            }
        }
    });
    // 渲染app, 并给temlate传递上下文context
    const html = await renderer.renderToString(app, context);
    res.end(html);
});
const port = 3000;
server.listen(port, () => console.log(`http://127.0.0.1:${port}`));
```
前面的这么多步骤，只是将vue的实例渲染并得到了一个完整的HTML页面，结果如图
![](/img/bVcRnuL)
**结果仅仅是得到了一个拥有HTML字符串的页面，没有javascript**，即使我们在vue实例app中写了点击事件@click等于methods中的一个方法，也会被忽略。那么如何才能够vue实例得到完整的渲染呢，请继续看。

## 4、客户端激活
我们已经实现了将一个vue实例渲染成HTML字符串，并配合template.html模板生成一个完整的HTML页面。剩下的就是讲服务端生成vue实例的代码通过`script`脚本的形式加入到我们生成的HTML页面中，我们的script脚本到达浏览器后，会生成一个与服务端相同的客户端vue实例，客户端实例通过app.$mount('#app')挂载，然后顺利地接管了带有有`data-server-rendered="true"`属性的DOM元素，这是运行在浏览器vue实例的`created`，`mounted`钩子会依次执行。

> 特别说明：由于没有使用webpack，我们只能选择esmodule模块来完成服务器和浏览器通用的代码。使用 `node --experimental-modules xxx.mjs`就可以在node.js中运行esmodule了。因此我们把所有的js的扩展名都改成了`.mjs`，并且使用`server.use(express.static('./'))`提供静态服务器，为浏览器载app.mjs，vue.esm.mjs，vue-router.esm.mjs等文件。在HTML中使用`<script type="module"></script>`加载浏览器代码。其中vue.esm.mjs，vue-router.esm.mjs两个文件是从vue的npm安装包中拷贝出来的，并且在代码的开头添加`var process = { env:{ NODE_ENV: 'development' } }`mock了环境变量，保证vue代码的正常运行。

### 4.1 完整的服务端渲染
源码：[demo05](https://github.com/yanguoliang/vue-ssr/tree/main/demo05)
```
// server.mjs
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
// 提供静态服务器，可以提供浏览器加载app.mjs，vue.esm.mjs，vue-router.esm.mjs
server.use(express.static('./'));
server.get('*', async (req, res) => {
    const { app } = createApp();
    const html = await renderer.renderToString(app, context);
    res.end(html);
});

const port = 3000;
server.listen(port, () => console.log(`http://127.0.0.1:${port}`));
```
```
// app.mjs
import Vue from './vue.esm.mjs';
Vue.config.devtools = true;
export const createApp = (context = {}) => {
    const app = new Vue({
        template: `<div id="app">
            <span @click="handleClick">hello {{str}}</span>
        </div>`,
        data() {
            return {
                str: 'Jack'
            }
        },
        created() {
            console.log('created');
        },
        mounted() {
            console.log('mounted');
        },
        methods:{
            handleClick(){
                this.str = 'Rose';
            }
        }
    });
    return { app }
}
```
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {{{meta}}}
    <title>{{title}}</title>
</head>
<body>
    <!-- vue实例渲染的字符串插在这里 -->
    <!--vue-ssr-outlet-->
    <script type='module'>
        import { createApp } from './app.mjs';
        const { app } = createApp();
        // 与服务端相同的vue实例app，挂载后接管服务端渲染的HTML
        app.$mount('#app', true);
    </script>
</body>
</html>
```
# 4.2 使用vue-router的服务端渲染
源码：[demo06](https://github.com/yanguoliang/vue-ssr/tree/main/demo06)
如果我们直接在浏览器地址栏请求`127.0.0.1:3000/foo`,此时浏览器会向服务器请求页面，服务器根据路由匹配一个完成的app实例，渲染成完整的HTML页面返回前端。如果使用`<router-link to='/foo'>foo</router-link>`从bar路由跳转到foo路由，浏览器不会向服务器发起请求（此时是客户端接管）。
```
// server.mjs
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
```
```
// app.mjs
import Vue from './vue.esm.mjs';
import VueRouter from './vue-router.esm.mjs'
Vue.config.devtools = true;
Vue.use(VueRouter);
export const createRouter = (context = {}) => {
    const Foo = { template: '<div>foo</div>', mounted(){console.log('foo mounted')} }
    const Bar = { template: '<div>bar</div>', mounted(){console.log('bar mounted')} }
    const routes = [
        { path: '/foo', component: Foo },
        { path: '/bar', component: Bar }
    ]
    return new VueRouter({
        mode: "history",
        routes
    })
}

export const createApp = (context = {}) => {
    const router = createRouter(context);
    const app = new Vue({
        router,
        template: `<div id="app">
            <router-link to="/foo">foo</router-link>
            <router-link to="/bar">bar</router-link>
            <span>hello {{str}}</span>
            <router-view></router-view>
        </div>`,
        data() {
            return {
                str: 'Jack'
            }
        },
        created() {
            console.log('created');
        },
        mounted() {
            console.log('mounted');
        }
    });
    return { app, router }
}
```
```
// template.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {{{meta}}}
    <title>{{title}}</title>
</head>
<body>
    <!-- vue实例渲染的字符串插在这里 -->
    <!--vue-ssr-outlet-->
    <script type='module'>
        import { createApp } from './app.mjs';
        const { app, router } = createApp();
        // 与服务端相同的vue实例app，挂载后接管服务端渲染的HTML
        router.onReady(() => app.$mount('#app', true))
    </script>
</body>
</html>
```
# 4.3 客户端数据预取
源码：[demo07](https://github.com/yanguoliang/vue-ssr/tree/main/demo07) 

这是[官方文档](https://ssr.vuejs.org/zh/guide/data.html#%E6%95%B0%E6%8D%AE%E9%A2%84%E5%8F%96%E5%AD%98%E5%82%A8%E5%AE%B9%E5%99%A8-data-store)说明。

vue路由会匹配路由对应的组件，调用组件的`asyncData`方法抓取数据渲染组件，并返回一个promise。待promise完成后得到一个完整的App实例，将App实例渲染成完整页面返回给浏览器。当`<router-link to='/foo'>foo</router-link>`从bar路由跳转到foo路由时，渲染则是客户端完成的。客户端vue通过`router.beforeResolve`拦截路由，然后调用`asyncData `方法，返回的promise完成后初始化渲染，然后调用next计入目标路由页面。
# 4.4 使用webpack配置服务端渲染
源码：[demo08](https://github.com/yanguoliang/vue-ssr/tree/main/demo08)
本栗子使用了vue-cli使用vue.config.js配置打包，通过`npm run build:client`和`npm run build:server`分别完成服务端和客户端的构建，得到通用的代码，client资源表`vue-ssr-client-manifest.json`和server资源表`vue-ssr-server-bundle.json`, 但是基本原理和前面讲的一样。