const { createBundleRenderer } = require('vue-server-renderer');
const koa = require('koa2');
const koaStatic = require('koa-static');
const template = require('fs').readFileSync('./public/index.html', 'utf-8');
const serverBundle = require('./dist/server/vue-ssr-server-bundle.json');
const clientManifest = require('./dist/client/vue-ssr-client-manifest.json');

const renderer = createBundleRenderer(serverBundle, {
    template,
    clientManifest,
});

var app = new koa();
app.use(koaStatic('./dist/client/'));
const main = async ctx => {
    const context = {title: 'ssr'}
    const html = await renderer.renderToString(context);
    console.log(html);
    ctx.body = html;
};
app.use(main);
const port = 3000
app.listen(port, () => console.log(`http://127.0.0.1:${port}`));
