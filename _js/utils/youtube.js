/**
 * This is a wrapper to return an instance of Google maps. It depends on the 
 * async plugin. 
 * https://github.com/millermedeiros/requirejs-plugins/blob/master/src/async.js
 *
 * @src http://techblog.realestate.com.au/loading-google-maps-with-requirejs/
 *
 * @return {object} Google maps object.
 */
define(['async!https://www.youtube.com/iframe_api!undefined:onYouTubeIframeAPIReady'], function() {
	return YT;
});