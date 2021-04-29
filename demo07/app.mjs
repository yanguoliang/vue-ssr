import Vue from './vue.esm.mjs';
import VueRouter from './vue-router.esm.mjs';
import Vuex from './vuex.esm.mjs';
Vue.config.devtools = true;

Vue.use(Vuex);
export const createStore = (context = {}) => {
    const items = [
        { "name": "Jack", "age": 19 },
        { "name": "Rose", "age": 18 }
    ];
    return new Vuex.Store({
        state: {
            items: [],
        },
        actions: {
            fetchItem({ commit }) {
                // `store.dispatch()` 会返回 Promise，
                // 以便我们能够知道数据在何时更新
                return Promise.resolve(items).then((data) => {
                    commit('setItem', data);
                });
            },
        },
        mutations: {
            setItem(state, items) {
                state.items = items;
            },
        },
    });
};

Vue.use(VueRouter);
export const createRouter = (context = {}) => {
    const Foo = {
        template: `
            <div>
                <h1>Foo</h1>
                <h3 v-for="item in items">{{item}}</h3>
            </div>
        `,
        computed:{
            items(){
                return this.$store.state.items;
            }
        },
        asyncData({ store, route }) {
            // 触发 action 后，会返回 Promise
            return store.dispatch('fetchItem', route.params.id);
        },
        mounted() {
            console.log('foo mounted');
        },
    };
    const Bar = {
        template: '<div>bar</div>',
        mounted() {
            console.log('bar mounted');
        },
    };
    const routes = [
        { path: '/foo', component: Foo },
        { path: '/bar', component: Bar },
    ];
    return new VueRouter({
        mode: 'history',
        routes,
    });
};

export const createApp = (context = {}) => {
    const router = createRouter(context);
    const store = createStore(context);
    const app = new Vue({
        store,
        router,
        template: `<div id="app">
            <router-link to="/foo"><h1>foo</h1></router-link>
            <router-link to="/bar"><h1>bar</h1></router-link>
            <span>hello {{str}}</span>
            <router-view></router-view>
        </div>`,
        data() {
            return {
                str: 'Jack',
            };
        },
    });
    return { app, router, store };
};
