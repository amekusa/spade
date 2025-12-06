import {createApp} from 'vue'

import {greet} from './fn.js';

import App from './vue/App.vue'; // root component

function main() {
	greet('my_app');
	let app = createApp(App)
	app.mount('#app');
}

document.addEventListener('DOMContentLoaded', main);
