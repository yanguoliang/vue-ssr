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

