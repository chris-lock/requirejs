/**
 * This is the config object for RequireJS. Paths are grouped libs, utils, and
 * modules and alphabetized. urlArgs is used to prevent browser caching in dev.
 *
 * @author Chris Lock
 *
 * @see	http://requirejs.org/
 */
requirejs.config({
	baseUrl: '/_js',
	paths: {
		// libs
		async: 'libs/async',
		jquery: 'libs/jquery/jquery-1.10.2.min',

		// utils
		breakpoints: 'utils/breakpoints',
		cookies: 'utils/cookies',
		dispatcher: 'utils/dispatcher',
		// geolocation: 'utils/geolocation',
		// googleMaps: 'utils/google-maps',
		// googleMapsApi: 'utils/google-maps-api',
		imageLoader: 'utils/image-loader',
		nthChild: 'utils/nth-child',
		os: 'utils/os',
		viewport: 'utils/viewport',
		youtube: 'utils/youtube',

		// modules
		carousel: 'modules/carousel',
	},
	urlArgs: (new Date()).getTime()
});

/**
 * All globaly included utils should be required here to reduce load time. While
 * it would be ideal to have the loader here to reduce HTTP requests, we need
 * it's methods for AJAX calls.
 *
 * Ideally all global utils and module should be concatenated with r.js or Grunt.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @return {void}
 */
define(['loader', 'breakpoints', 'cookies', 'dispatcher', 'imageLoader', 'nthChild', 'viewport', 'youtube']);