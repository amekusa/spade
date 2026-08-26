import {createApp} from 'vue';
import {createRouter, createWebHistory} from 'vue-router';

// Helper functions
import {greet} from './fn.js';

// Vue components
import App from './vue/App.vue'; // Base component
import Home from './vue/Home.vue';
import About from './vue/About.vue';
import Three from './vue/Three.vue';
import Settings from './vue/Settings.vue';
import Appearance from './vue/Appearance.vue';

// Vue router
const router = createRouter({
	history: createWebHistory(),
	linkActiveClass: 'current',
	linkExactActiveClass: '',
	routes: [
		{
			path: '/',
			component: Home
		},
		{
			path: '/about',
			component: About,
		},
		{
			path: '/three',
			component: Three,
		},
		{
			path: '/settings',
			component: Settings,
			children: [
				{
					path: 'appearance',
					component: Appearance,
				},
			],
		},
	],
});

function main() {
	greet('my_app');
	let app = createApp(App);
	app.use(router);
	app.mount('#app');
}

document.addEventListener('DOMContentLoaded', main);
