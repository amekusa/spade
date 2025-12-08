/**
 * Gulp Tasks
 * @author Satoshi Soma (amekusa.com)
 */

const // node
	{env, chdir} = require('node:process'),
	{dirname, basename} = require('node:path');

const prod = env.NODE_ENV == 'production';

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
const dir = {};
for (let i in paths) {
	paths[i] = `${root}/${paths[i]}`;
	dir[i] = dirname(paths[i]);
}
const {
	dist_html,
	dist_css,
	dist_js,
	src_html,
	src_css,
	src_js,
} = paths;

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
		return io.rm(dir.dist_js);
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
		let dst = dir.dist_js;
		let src = [
			`${dir.dist_js}/**/*.js`,
			`!${dir.dist_js}/**/*.min.js`,
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

	css_clean() {
		return io.rm(dir.dist_css);
	},

	css_build() {
		bs.notify(`Building CSS...`);
		let dst = dist_css;
		let src = src_css;
		let opts = prod ? '' : '--source-map';
		return sh.exec(`lessc ${opts} '${src}' '${dst}'`).catch(err => {
			bs.notify(`<b style="color:hotpink">CSS Build Failure!</b>`, 15000);
			throw err;
		});
	},

	css_minify() {
		let dst = dir.dist_css;
		let src = [
			`${dir.dist_css}/**/*.css`,
			`!${dir.dist_css}/**/*.min.css`,
		];
		let opts = {
			inline: ['all'],
			level: 1,
		};
		return $.src(src)
			.pipe(io.modifyStream((data, enc) => {
				return minifyCSS(data, enc, opts).then(r => {
					log(`Minify stats:`, r.stats.summary);
					return r.data;
				});
			}))
			.pipe($rename({extname: '.min.css'}))
			.pipe($.dest(dst));
	},

	html_clean() {
		return io.rm(dir.dist_html);
	},

	html_build() {
		let dst = dir.dist_html;
		let src = src_html;
		return $.src(src)
			.pipe(io.modifyStream((data, enc) => {
				if (prod) {
					let js = basename(dist_js);
					let css = basename(dist_css);
					data = data.replaceAll(js, io.ext(js, '.min.js'));
					data = data.replaceAll(css, io.ext(css, '.min.css'));
				}
				return data;
			}))
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
T.css = $S(
	T.css_clean,
	T.css_build,
	T.css_minify
);
T.html = $S(
	T.html_clean,
	T.html_build
);

module.exports = T;
