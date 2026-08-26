/**
 * Gulp Helpers
 * @author Satoshi Soma (amekusa.com)
 */

const M = {

	/**
	 * Wraps a function as a task that resolves on return.
	 * @param {string|function} 1st - Task name or task function
	 * @param {function} 2nd - Task function (if the 1st is name)
	 * @return {function} Wrapped function
	 */
	$task(...args) {
		let name, fn;
		if (args.length > 1) {
			name = args[0];
			fn = args[1];
		} else if (args.length == 1) {
			fn = args[0];
			name = fn.name;
		}
		let r = resolve => {
			let ret = fn();
			return (ret instanceof Promise) ? ret : resolve();
		};
		if (name) Object.defineProperty(r, 'name', {value: name, writable: false});
		return r;
	},

	/**
	 * Creates a function that does nothing but resolves.
	 */
	$noop() {
		return resolve => resolve();
	},

	/**
	 * Conditionally switches the given funcion to an alternative.
	 * @param {boolean} cond - Condition
	 * @param {function} fn - Function to return when `cond` is true
	 * @param {function} [fnAlt] - Alternative function to return when `cond` is false. Defaults to "noop"
	 * @return {function}
	 */
	$if(cond, fn, fnAlt) {
		return cond ? fn : (fnAlt || M.$noop());
	},

};

module.exports = M;
