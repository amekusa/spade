/**
 * Rollup Config
 *
 * Use with:
 *   rollup -c
 */

const {dirname} = require('node:path');
const {env} = require('node:process');
const prod = env.NODE_ENV == 'production';

// plugins
const nodeResolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const strip = require('@rollup/plugin-strip');
const vue = require('rollup-plugin-vue');

const {name, paths: {dist_js, src_js}} = require('./build.json');
const dir = {src_js: dirname(src_js)};

const M = {
	input: src_js,
	output: {
		name,
		file: dist_js,
		format: 'iife',
		indent: !prod,
		sourcemap: !prod,
		compact: prod,
},
	treeshake: prod,
	watch: {
		include: [
			`${dir.src_js}/**`,
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
				'process.env.NODE_ENV': prod ? '"production"' : '"development"',
				  // NOTE: Necessary to fix "process is not defined" error in browser.

				// Vue.js compile-time flags
				// see: https://vuejs.org/api/compile-time-flags.html
				'__VUE_OPTIONS_API__': 'true',
				'__VUE_PROD_DEVTOOLS__': 'false',
				'__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
			},
		}),
		vue(),
	],
};

if (prod) {
	M.plugins.push(
		strip({
			include: `${dir.src_js}/**/*.js`,
			functions: [
				'console.log',
				'console.debug',
				'assert.*',
			]
		})
	);
}

module.exports = M;
