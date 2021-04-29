const main = async () => {
    // 第 1 步：创建一个 Vue 实例
    const Vue = require('vue');
    const app = new Vue({
        template: `<div>hello world</div>`,
    });

    // 第 2 步：创建一个 renderer
    const renderer = require('vue-server-renderer').createRenderer();

    // 第 3 步：将 Vue 实例渲染为 HTML
    const html = await renderer.renderToString(app);
    // html结果为字符串：<div>hello world</div>

    console.log(html);
};
main();

