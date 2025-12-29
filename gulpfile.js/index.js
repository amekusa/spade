/**
 * Gulp Tasks
 * @author Satoshi Soma (amekusa.com)
 */

// node
const {rm} = require('node:fs/promises');
const {join, dirname, basename, relative} = require('node:path');
const {env, chdir, exit} = require('node:process');
const prod = env.NODE_ENV == 'production';
const dev = !prod;

// gulp
const $ = require('gulp');
const $S = $.series;
const $P = $.parallel;

// gulp plugins
const $rename = require('gulp-rename');

// misc.
const {rollup} = require('rollup');
const bs = require('browser-sync').create();
const {subst, io, sh} = require('@amekusa/util.js');
const {minifyJS, minifyCSS} = require('./minify.js');

// shortcuts
const {log, debug, warn, error} = console;

// project root
const root = dirname(__dirname); chdir(root);

// config
const config = require(`${root}/build.json`);
const paths = {};
const dirs = {};
for (let k in config.paths) {
	let v = config.paths[k];
	let dir = '';
	if      (k.startsWith('dist_')) dir = config.paths.dist;
	else if (k.startsWith('src_'))  dir = config.paths.src;
	paths[k] = join(root, dir, v);
	dirs[k] = dirname(paths[k]);
}
const {
	dist_css,
	dist_js,
	src_css,
	src_js,
} = paths;

// context
const C = {
	rollup: null, // rollup config
	imported: null, // HTML for imported assets
};

// tasks
const T = {

	default(done) {
		log(`Gulp: Available tasks:`);
		for (let key in $.registry().tasks()) log(key);
		done();
	},

	clean() {
		return rm(paths.dist, {force: true, recursive: true});
	},

	run(done) {
		return bs.active ? done() : bs.init({
			open: false,
			server: {
				baseDir: paths.dist,
				index: 'index.html',
			},
			injectNotification: 'overlay', // console | overlay
			injectFileTypes: ['css', 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'map'],
				// NOTE: Add 'js' to enable JS injection
			ghostMode: {
				clicks: false,
				forms: false,
				scroll: false
			},
		}, done);
	},

	js_build() {
		bs.notify(`Building JS...`);

		let conf = C.rollup;
		if (conf) {
			if (typeof conf.cache == 'object') log(`Rollup: Cache is used.`);
			else conf.cache = dev;
		} else {
			conf = require(`${root}/rollup.config.js`);
			conf.cache = dev;
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

		}).then(() => {
			bs.reload();
		});
	},

	js_minify() {
		let dst = dirs.dist_js;
		let src = [
			`${dirs.dist_js}/**/*.js`,
			`!${dirs.dist_js}/**/*.min.js`,
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

	css_build() {
		bs.notify(`Building CSS...`);
		let dst = dist_css;
		let src = src_css;
		let opts = prod ? '' : '--source-map';
		return sh.exec(`lessc ${opts} '${src}' '${dst}'`).catch(err => {
			bs.notify(`<b style="color:hotpink">CSS Build Failure!</b>`, 15000);
			throw err;
		}).then(() => {
			bs.reload('*.css');
		});
	},

	css_minify() {
		let dst = dirs.dist_css;
		let src = [
			`${dirs.dist_css}/**/*.css`,
			`!${dirs.dist_css}/**/*.min.css`,
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

	html_build() {
		let dst = paths.dist;
		let src = `${paths.src}/index.html`;
		return $.src(src)
			.pipe(io.modifyStream((content, enc) => {
				let data = Object.assign({
					imported: C.imported,
				}, config);
				return subst(content, data, {
					modifier(v, k) {
						if (prod) {
							switch (k) {
							case 'paths.dist_js':
								v = io.ext(v, '.min.js');
								break;
							case 'paths.dist_css':
								v = io.ext(v, '.min.css');
								break;
							}
						}
						return v;
					}
				});
			}))
			.pipe($.dest(dst));
	},

	html_assets(done) {
		let {imports} = config;
		if (!imports) return done();
		if (C.imported) return done();
		let importer = new io.AssetImporter({
			minify: prod,
			src: paths.src,
			dst: paths.dist,
		});
		importer.add(imports);
		return importer.import().then(() => {
			C.imported = {};
			for (let k in importer.results) {
				C.imported[k] = importer.toHTML(k);
			}
		});
	},

	watch() {
		// auto-build js
		$.watch([
			`${dirs.src_js}/**/*.{js,vue}`,
		], T.js_build);

		// auto-build css
		$.watch([
			`${dirs.src_css}/**/*.{less,css}`,
		], T.css_build);

		// auto-build html
		$.watch([
			`${paths.src}/index.html`,
		], T.html_build);
	},
}

const noop = done => {done()};
const $prod = prod
	? task => task
	: ()   => noop;

T.js = prod ? $S(
	T.js_build,
	T.js_minify
) : T.js_build;

T.css = prod ? $S(
	T.css_build,
	T.css_minify
) : T.css_build;

T.html = $S(
	T.html_assets,
	T.html_build,
);

T.build = $P(
	T.js,
	T.css,
	T.html
);

T.dist = $S(
	$prod(T.clean),
	T.build,
	T.run
);

T.dev = $S(
	T.dist,
	T.watch
);

module.exports = T;
