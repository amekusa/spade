const fs = require('node:fs');
const {join, dirname, basename} = require('node:path');
const {io} = require('@amekusa/nodeutil');

/**
 * File importer.
 * @author Satoshi Soma (amekusa.com)
 * @license Apache-2.0
 * Copyright 2020 Satoshi Soma
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class FileImporter {
	/**
	 * @param {object} config
	 * @param {boolean} [config.minify=false] - Prefer `*.min.*` version
	 * @param {string} config.src - Source dir to search
	 * @param {string} config.dst - Destination dir
	 */
	constructor(config) {
		this.config = Object.assign({
			minify: false,
			src: '', // source dir to search
			dst: '', // destination dir
		}, config);
		this.queue = [];
		this.results = {
			script: [],
			style:  [],
			asset:  [],
		};
	}
	/**
	 * Adds a new item to import.
	 * @param {string|string[]|object|object[]} newImport
	 */
	add(newImport) {
		if (!Array.isArray(newImport)) newImport = [newImport];
		for (let i = 0; i < newImport.length; i++) {
			let item = newImport[i];
			switch (typeof item) {
			case 'string':
				item = {src: item};
				break;
			case 'object':
				if (Array.isArray(item)) throw `invalid type: array`;
				break;
			default:
				throw `invalid type: ${typeof item}`;
			}
			if (!('src' in item)) throw `'src' property is missing`;
			this.queue.push(Object.assign({
				order: 0,
				resolve: 'local',
				private: false,
			}, item));
		}
	}
	/**
	 * Resolves the location of the given file path
	 * @param {string} file - File path
	 * @param {string} method - Resolution method
	 * @return {string} Resolved file path
	 */
	resolve(file, method) {
		let find = [];
		if (this.config.minify) {
			let ext = io.ext(file);
			find.push(io.ext(file, '.min' + ext));
		}
		find.push(file);
		for (let i = 0; i < find.length; i++) {
			let r;
			switch (method) {
			case 'module':
				try {r = require.resolve(find[i]);} catch (e) {
					if (e.code == 'MODULE_NOT_FOUND') continue;
					throw e;
				}
				return r;
			case 'local':
				r = join(this.config.src, find[i]);
				if (fs.existsSync(r)) return r;
				break;
			case 'local:absolute':
			case 'local:abs':
				r = find[i];
				if (fs.existsSync(r)) return r;
				break;
			default:
				throw `invalid resolution method: ${method}`;
			}
		}
		throw `cannot resolve '${file}'`;
	}
	/**
	 * Imports all items in the queue at once.
	 */
	import() {
		let typeMap = {
			'.css': 'style',
			'.js': 'script',
		};
		this.queue.sort((a, b) => (Number(a.order) - Number(b.order))); // sort by order
		while (this.queue.length) {
			let item = this.queue.shift();
			let {type, src} = item;
			let url;

			if (!item.resolve) { // no resolution
				url = src;
				if (!type) type = typeMap[io.ext(src)] || 'asset';
				console.log('---- File Link ----');
				console.log(' type:', type);
				console.log('  src:', src);

			} else { // needs resolution
				let {dst:dstDir, as:dstFile} = item;
				let create = item.resolve == 'create'; // needs creation?
				if (create) {
					if (!dstFile) throw `'as' property is required with {resolve: 'create'}`;
				} else {
					src = this.resolve(src, item.resolve);
					if (!dstFile) dstFile = basename(src);
				}
				if (!type) type = typeMap[io.ext(dstFile)] || 'asset';
				if (!dstDir) dstDir = type + 's';

				// absolute destination
				url = join(dstDir, dstFile);
				let dst = join(this.config.dst, url);
				dstDir = dirname(dst);
				if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, {recursive:true});
				if (create) {
					fs.writeFileSync(dst, src);
					console.log('---- File Creation ----');
					console.log(' type:', type);
					console.log('  dst:', dst);
				} else {
					fs.copyFileSync(src, dst);
					console.log('---- File Import ----');
					console.log(' type:', type);
					console.log('  src:', src);
					console.log('  dst:', dst);
				}
			}

			if (!item.private) {
				if (!(type in this.results)) this.results[type] = [];
				this.results[type].push({type, url});
			}
		}
	}
}

module.exports = FileImporter;
