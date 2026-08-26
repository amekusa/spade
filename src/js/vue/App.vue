<script setup>
import {ref} from 'vue';
let count = ref(0);
</script>

<template>
	<h1>My App</h1>
	<p><button @click="count++">You clicked me {{ count }} times.</button></p>
	<p><strong>Current route path:</strong> {{ $route.fullPath }}</p>
	<nav class="pages">
		<RouterLink to="/">Home</RouterLink>
		<RouterLink to="/about">About</RouterLink>
		<RouterLink to="/three">Three.js Demo</RouterLink>
		<RouterLink to="/settings">Settings</RouterLink>
	</nav>
	<main>
		<RouterView />
	</main>
</template>
