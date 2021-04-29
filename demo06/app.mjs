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