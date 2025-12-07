/**
 * Gulp Tasks
 * @author Satoshi Soma (amekusa.com)
 */

const // node
	{chdir} = require('node:process'),
	{dirname, basename} = require('node:path');

const // gulp
	$ = require('gulp'),
	$rename = require('gulp-rename'),
	$S = $.series,
	$P = $.parallel;

const // rollup
	{rollup} = require('rollup');

const // browser-sync
	bs = require('browser-sync').create();

const // misc
	{io, sh} = require('@amekusa/nodeutil'),
	{minifyJS, minifyCSS} = require('./minify.js');

const // shortcuts
	{log, debug, warn, error} = console;

// project root
const root = dirname(__dirname); chdir(root);

// paths
const {paths} = require(`${root}/build.json`);
for (let i in paths) {
	paths[i] = `${root}/${paths[i]}`;
}
const {
	dist_js,
	src_js,
	src_html,
	src_less,
} = paths;

const // directories
	dist_js_dir = dirname(dist_js),
	src_js_dir = dirname(src_js);

// context
const C = {
	rollup: null, // rollup config
};

// Tasks
const T = {

	default(done) {
		log(`Gulp: Available tasks:`);
		for (let key in $.registry().tasks()) log(key);
		done();
	},

	js_clean() {
		return io.rm(dist_js_dir);
	},

	js_build() {
		bs.notify(`Building JS...`);

		let conf = C.rollup;
		if (conf) {
			if (typeof conf.cache == 'object') log(`Rollup: Cache is used.`);

		} else {
			conf = require(`${root}/rollup.config.js`);
			conf.cache = bs.active;
		}
		return rollup(conf).then(bundle => {
			if (bundle.cache) {
				conf.cache = bundle.cache;
				log(`Rollup: Cache is stored.`);
			}
			C.rollup = conf;
			return bundle.write(conf.output);

		}).catch(err => {
			bs.notify(`<b style="color:hotpink">JS Build Failure!</b>`, 15000);
			throw err;
		});
	},

	js_minify() {
		let dst = dist_js_dir;
		let src = [
			`${dist_js_dir}/**/*.js`,
			`!${dist_js_dir}/**/*.min.js`,
		];
		let opts = {};
		return $.src(src)
			.pipe(io.modifyStream((data, enc) => {
				return minifyJS(data, enc, opts).then(r => {
					log(`Minify stats:`, r.stats.summary);
					return r.data;
				});
			}))
			.pipe($rename({extname: '.min.js'}))
			.pipe($.dest(dst));
	},

}

/**
 * Composite Tasks
 */
T.js = $S(
	T.js_clean,
	T.js_build,
	T.js_minify
);

module.exports = T;
