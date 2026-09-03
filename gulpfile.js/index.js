/**
 * Gulp Tasks
 * @author Satoshi Soma (amekusa.com)
 */

// node
const {rm, readFile, writeFile} = require('node:fs/promises');
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
const {$task} = require('./helpers.js');
const minify = require('./minify.js');

// shortcuts
const {log, debug, warn, error} = console;

// project root
const root = dirname(__dirname); chdir(root);

// context
const C = {};

// initialize the context
function init() {
	let config = io.requireNew(`${root}/build.json`);
	let paths = {};
	let dirs = {};
	for (let k in config.paths) {
		let v = config.paths[k];
		let dir = '';
		if      (k.startsWith('dst_')) dir = config.paths.dst;
		else if (k.startsWith('src_')) dir = config.paths.src;
		paths[k] = join(root, dir, v);
		dirs[k] = dirname(paths[k]);
	}
	C.config = config; // build config
	C.paths = paths; // absolute paths
	C.dirs = dirs; // absolute dirs
	C.rollup = null; // rollup cache
}

init();

function minifyJS(data, enc) {
	let opts = {};
	return minify.minifyJS(data, enc, opts).then(r => {
		log(`Minify stats:`, r.stats.summary);
		return r.data;
	});
}

function minifyCSS(data, enc) {
	let opts = {
		inline: ['all'],
		level: 1,
	};
	return minify.minifyCSS(data, enc, opts).then(r => {
		log(`Minify stats:`, r.stats.summary);
		return r.data;
	});
}

// tasks
const T = {

	default(done) {
		log(`Gulp: Available tasks:`);
		for (let key in $.registry().tasks()) log(key);
		done();
	},

	clean() {
		return rm(C.paths.dst, {force: true, recursive: true});
	},

	run(done) {
		return bs.active ? done() : bs.init({
			server: {
				baseDir: C.paths.dst,
				index: 'index.html',
			},
			single: true, // Required for vue-router
			open: false,
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
			conf = io.requireNew(`${root}/rollup.config.js`);
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
		let src = C.paths.dst_js;
		let dst = C.dirs.dst_js;
		return $.src(src)
			.pipe(io.modifyStream((data, enc) => minifyJS(data, enc)))
			.pipe($rename({extname: '.min.js'}))
			.pipe($.dest(dst));
	},

	css_build() {
		bs.notify(`Building CSS...`);
		let src = C.paths.src_css;
		let dst = C.paths.dst_css;
		let opts = prod ? '' : '--source-map';
		return sh.exec(`lessc ${opts} '${src}' '${dst}'`).catch(err => {
			bs.notify(`<b style="color:hotpink">CSS Build Failure!</b>`, 15000);
			throw err;
		}).then(() => {
			bs.reload('*.css');
		});
	},

	css_minify() {
		let src = C.paths.dst_css;
		let dst = C.dirs.dst_css;
		return $.src(src)
			.pipe(io.modifyStream((data, enc) => minifyCSS(data, enc)))
			.pipe($rename({extname: '.min.css'}))
			.pipe($.dest(dst));
	},

	html_build() {
		let src = `${C.paths.src}/index.html`;
		let dst = C.paths.dst;
		let r = $.src(src)
			.pipe(io.modifyStream((content, enc) => {
				let data = Object.assign({
					assets: C.assetsHTML,
				}, C.config);
				return subst(content, data, {
					modifier(v, k) {
						if (prod) {
							switch (k) {
							case 'paths.dst_js':
								v = io.ext(v, '.min.js');
								break;
							case 'paths.dst_css':
								v = io.ext(v, '.min.css');
								break;
							}
						}
						return v;
					}
				});
			}))
			.pipe($.dest(dst));

		if (C.config.tweaks['404_fallback']) {
			r = r.pipe($rename('404.html')).pipe($.dest(dst));
		}
		return r;
	},

	html_assets(done) {
		if (!C.assets) {
			C.assets = io.requireNew(`${root}/assets.json`);
			C.assetsHTML = {};
			C.assetImporter = new io.AssetImporter({
				src: C.paths.src_assets,
				dst: C.paths.dst_assets,
				minify: dev ? false : (file, opts) => {
					let extension = io.ext(file);
					let minify = {
						'.js':  minifyJS,
						'.css': minifyCSS,
					}[extension];
					if (!minify) return Promise.resolve();
					let {encoding} = opts;
					return readFile(file, {encoding})
						.then(data => minify(data, encoding))
						.then(data => writeFile(file, data, {encoding}));
				},
			});
		}
		let importer = C.assetImporter;
		importer.add(C.assets);
		if (C.config.tweaks.nojekyll) {
			importer.add({resolve: 'create', as: '.nojekyll', src: '', dst: '.'});
		}
		return importer.import().then(() => {
			for (let type in importer.results) {
				C.assetsHTML[type] = importer.toHTML(type);
			}
		});
	},

}

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

T.dist = prod ? $S(
	T.clean,
	T.build,
	T.run
) : $S(
	T.build,
	T.run
);

T.watch = function watch() {
	$.watch([
		`${C.dirs.src_js}/**/*.{js,vue}`,
	], T.js_build);

	$.watch([
		`${C.dirs.src_css}/**/*.{less,css}`,
	], T.css_build);

	$.watch([
		`${C.paths.src}/index.html`,
	], T.html_build);

	$.watch([
		`${root}/assets.json`,
	], $S(
		$task(() => { C.assets = null }),
		T.html
	));

	$.watch([
		`${C.paths.src_assets}/**/*`,
	], T.html);

	$.watch([
		`${root}/rollup.config.js`,
	], $S(
		$task(() => { C.rollup = null }),
		T.js_build
	));

	$.watch([
		`${root}/package.json`,
		`${root}/build.json`,
	], bs.active ? $S(
		$task(bs.exit),
		$task(init),
		T.build,
		T.run
	) : $S(
		$task(init),
		T.build
	));
};

T.dev = $S(
	T.dist,
	T.watch
);

module.exports = T;
