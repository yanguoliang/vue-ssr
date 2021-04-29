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