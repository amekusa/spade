/**
 * Example: three.js
 * Requirements:
 *   npm i --save-dev three
 */

import * as THREE from 'three';
import {ViewHelper} from 'three/addons/helpers/ViewHelper.js';

let renderer;

export function start(rendererOpts) {
	end();
	const width = window.innerWidth, height = 240;
	renderer = new THREE.WebGLRenderer(rendererOpts);
	renderer.setSize(width, height);
	renderer.setAnimationLoop(animate);
	// document.body.appendChild(renderer.domElement);

	const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
	camera.position.z = 1;

	const scene = new THREE.Scene();
	const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
	const material = new THREE.MeshNormalMaterial();
	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	function animate(time) {
		mesh.rotation.x = time / 2000;
		mesh.rotation.y = time / 1000;
		renderer.render(scene, camera);
	}
}

export function end() {
	if (renderer) {
		renderer.dispose();
		renderer = null;
	}
}
