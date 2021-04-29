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

