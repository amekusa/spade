/**
 * Rollup Config
 *
 * Use with:
 *   rollup -c
 */

const {join, dirname} = require('node:path');
const {env} = require('node:process');
const prod = env.NODE_ENV == 'production';
const dev = !prod;

// plugins
const nodeResolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const strip = require('@rollup/plugin-strip');
const vue = require('rollup-plugin-vue');

const {
	name,
	paths: {
		src,
		src_js,
		dst,
		dst_js,
	}
} = require('./build.json');

const input = join(src, src_js);
const input_dir = dirname(input);

const M = {
	input,
	output: {
		name,
		file: join(dst, dst_js),
		format: 'iife',
		indent: dev,
		sourcemap: dev,
		compact: prod,
	},
	treeshake: prod,
	watch: {
		include: [
			`${input_dir}/**/*`,
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
				// Fix "process is not defined" error in browser
				'process.env.NODE_ENV': prod ? '"production"' : '"development"',

				// Vue.js compile-time flags
				// See: https://vuejs.org/api/compile-time-flags.html
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
			include: `${input_dir}/**/*.js`,
			functions: [
				'console.log',
				'console.debug',
				'assert.*',
			]
		})
	);
}

module.exports = M;
