<script>
import {ref} from 'vue';
import {start, end} from '../demos/three.js';

export default {
	setup() {
		let cnv = ref(null);
		return {
			cnv,
		};
	},
	mounted() {
		start({
			canvas: this.cnv,
			antialias: true,
		});
	},
	unmounted() {
		end();
	}
};
</script>

<style scoped>
canvas {
	width:  100% !important;
}
</style>

<template>
	<h2>Three.js Demo</h2>
	<canvas ref="cnv"></canvas>
</template>
