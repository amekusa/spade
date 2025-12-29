<script setup>
import {ref} from 'vue';
let count = ref(0);
</script>

<template>
	<h1>My App</h1>
	<div>
		<button @click="count++">You clicked me {{ count }} times.</button>
	</div>
	<p><strong>Current route path:</strong> {{ $route.fullPath }}</p>
	<nav>
		<ul>
			<li><RouterLink to="/">Home</RouterLink></li>
			<li><RouterLink to="/about">About</RouterLink></li>
			<li><RouterLink to="/three">Three.js Demo</RouterLink></li>
		</ul>
	</nav>
	<main>
		<RouterView />
	</main>
</template>
