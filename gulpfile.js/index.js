/**
 * Gulp Tasks
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
	{io, sh} = require('@amekusa/nodeutil');

const // shortcuts
	{log, debug, warn, error} = console;

// project root
const root = dirname(__dirname); chdir(root);

// load settings
const pkg = require(`${root}/package.json`);

// context
const C = {
	rollup: null, // rollup config
};

// Tasks
const T = {

	default(done) {
		log('Gulp: Available tasks:');
		for (let key in $.registry().tasks()) log(key);
		done();
	},

	js_build() {
		bs.notify(`Building JS...`);

		let conf = C.rollup;
		if (conf) {
			if (typeof conf.cache == 'object') log('Rollup: Cache is used.');

		} else {
			conf = require(`${root}/rollup.config.js`);
			conf.cache = bs.active;
		}
		return rollup(conf).then(bundle => {
			if (bundle.cache) {
				conf.cache = bundle.cache;
				log('Rollup: Cache is stored.');
			}
			C.rollup = conf;
			return bundle.write(conf.output);

		}).catch(err => {
			bs.notify(`<b style="color:hotpink">JS Build Failure!</b>`, 15000);
			throw err;
		});
	}
}

module.exports = T;
