/**
 * Example: three.js
 * Requirements:
 *   npm i --save-dev three
 */

import * as THREE from 'three';
import {ViewHelper} from 'three/addons/helpers/ViewHelper.js';

let renderer, resizer;

export function start(rendererOpts) {
	end();
	let {canvas} = rendererOpts;
	let aspect = 16 / 9;
	let width  = canvas.clientWidth;
	let height = width / aspect;

	renderer = new THREE.WebGLRenderer(rendererOpts);
	renderer.setSize(width, height, false);
	renderer.setAnimationLoop(animate);

	let camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
	camera.aspect = aspect;
	camera.position.z = 1;

	resizer = new ResizeObserver(entries => {
		let {width} = entries[0].contentRect;
		let height = width / aspect;
		renderer.setSize(width, height, false);
		camera.updateProjectionMatrix();
	});
	resizer.observe(canvas);

	let scene = new THREE.Scene();
	let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
	let material = new THREE.MeshNormalMaterial();
	let mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	function animate(time) {
		mesh.rotation.x = time / 2000;
		mesh.rotation.y = time / 1000;
		renderer.render(scene, camera);
	}
}

export function end() {
	if (renderer) {
		resizer.disconnect();
		resizer = null;
		renderer.dispose();
		renderer = null;
	}
}
