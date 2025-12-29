<script>
import {ref} from 'vue';
import {start, end} from '../demos/three.js';

export default {
	setup() {
		let canvas = ref(null);
		return {
			canvas,
		};
	},
	mounted() {
		start({
			antialias: true,
			canvas: this.canvas,
		});
	},
	unmounted() {
		end();
	}
};
</script>

<template>
	<h2>Three.js Demo</h2>
	<canvas ref="canvas"></canvas>
</template>
