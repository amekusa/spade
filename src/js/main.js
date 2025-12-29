import {createApp} from 'vue';
import {createRouter, createWebHistory} from 'vue-router';

// Helper functions
import {greet} from './fn.js';

// Vue components
import App from './vue/App.vue'; // Base component
import Home from './vue/Home.vue';
import About from './vue/About.vue';
import Three from './vue/Three.vue';

// Vue router
const router = createRouter({
	history: createWebHistory(),
	routes: [
		{path: '/',      component: Home},
		{path: '/about', component: About},
		{path: '/three', component: Three},
	]
});

function main() {
	greet('my_app');
	let app = createApp(App);
	app.use(router);
	app.mount('#app');
}

document.addEventListener('DOMContentLoaded', main);
