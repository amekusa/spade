/**
 * Rollup Config
 *
 * Use with:
 *   rollup -c
 */

const {env} = require('node:process');
const prod = env.NODE_ENV == 'production';

// plugins
const nodeResolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const strip = require('@rollup/plugin-strip');
const vue = require('rollup-plugin-vue');

const M = {
	input: 'src/js/main.js',
	output: {
		name: 'my_app',
		file: 'app/bundle.js',
		format: 'iife',
		indent: !prod,
		sourcemap: !prod,
		compact: prod,
	},
	treeshake: prod,
	watch: {
		include: [
			'src/js/**',
			'package.json',
		],
	},
	plugins: [
		nodeResolve({
			browser: true,
		}),
		replace({
			preventAssignment: true,
			values: {
				'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
				  // NOTE: Necessary to fix "process is not defined" error in browser.
			},
		}),
		vue(),
	],
};

if (prod) {
	M.plugins.push(
		strip({
			include: 'src/js/**/*.js',
			functions: [
				'console.log',
				'console.debug',
				'assert.*',
			]
		})
	);
}

module.exports = M;
