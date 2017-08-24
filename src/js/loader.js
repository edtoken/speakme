const _ = require('lodash');
const config = require('src/js/config');
const buildConfig = require('src/js/config.build');

const Cookie = require('src/js/Cookie');
const AsyncLoader = require('src/js/AsyncLoader');

const loaderWrapperNode = document.getElementById('loader-backdrop');
const loaderMessageNode = document.getElementById('loader-message');

const chungGroups = {
	'map': /\.map/,
	'json': /\.json/,
	'js': /\.js/,
	'css': /\.css/
};

const ignoreChunks = buildConfig.__BUILD_CHUNKS__.slice(0).map(s => (new RegExp('' + s + '')));

const isIgnoreStatsFile = (filePath) => {
	for (let i = ignoreChunks.length; i--;) {
		if (ignoreChunks[i].test(filePath)) {
			return true;
		}
	}
	return false;
};

const parseStatsFile = (list, output) => {

	for (let k in list) {

		if (typeof list[k] === 'string') {
			if (isIgnoreStatsFile(list[k])) {
				continue;
			}

			for (let group in chungGroups) {
				if (chungGroups[group].test(list[k])) {
					output[group].push(list[k]);
					break;
				}
			}
		} else {
			parseStatsFile(list[k], output);
		}
	}

	return output;
};

const domReady = (function(domReady) {

	const isBrowserIeOrNot = () => {
		return (!document.attachEvent || typeof document.attachEvent === "undefined" ? 'not-ie' : 'ie');
	};

	domReady = function(callback) {

		if (callback && typeof callback === 'function') {

			if (domReady.isReady) {
				callback();
			}

			if (isBrowserIeOrNot() !== 'ie') {
				document.addEventListener("DOMContentLoaded", function() {
					return callback();
				});
			} else {
				document.attachEvent("onreadystatechange", function() {
					if (document.readyState === "complete") {
						return callback();
					}
				});
			}
		} else {
			console.error('The callback is not a function!');
		}
	};

	domReady.isReady = domReady.isReady || false;

	if (!domReady.readyCallback) {
		domReady.readyCallback = domReady(function() {
			domReady.isReady = true;
		});
	}

	return domReady;
})(domReady || {isReady: false, readyCallback: false});

const waitApis = (names, cb) => {
	return setTimeout(function() {
		if (!_.every(names, (name) => {
				let keys = name.split('.').reverse();
				let obj = window;
				while (keys.length) {
					let key = keys.pop();
					if (!obj[key]) {
						return false;
					}

					obj = obj[key];
					return true;
				}
			})) {

			return waitApis(names, cb);
		}

		return cb();
	}, 100);
};

console.info('loader.js.config', JSON.parse(JSON.stringify(config)), 'time:', new Date().toString());

let firstLoad = true;
const loadStats = () => {
	// const statsJsonUrl = config.__FRONTEND_URL__ + '/stats' + (config.__DEVELOPMENT__ ? '' : '.' + new Date().toString()) + '.json';
	const statsJsonUrl = config.__FRONTEND_URL__ + '/stats' + (config.__DEVELOPMENT__ ? '' : '') + '.json';

	AsyncLoader.getJSON(statsJsonUrl).then(function(resp) {
		const clientVersionHash = Cookie.get('__BUILD_HASH__');

		if (clientVersionHash === resp.BUILD_HASH && !firstLoad) {
			console.info('actual static files, ', new Date().toString());
			return;
		}

		document.title = 'loading... 10%';

		loaderWrapperNode.style.display = 'block';
		loaderMessageNode.innerHTML = 'loading ...10%';

		Cookie.set('__BUILD_HASH__', resp.BUILD_HASH);

		firstLoad = false;

		let statsData = parseStatsFile(resp.assetsByChunkName, {
			css: buildConfig.__EXTERNAL__STYLES__.slice(0),
			js: buildConfig.__EXTERNAL_SCRIPTS__.slice(0),
			map: [],
			json: []
		});

		console.info('loader.js.resp', resp, 'time:', new Date().toString());
		console.info('loader.js.statsData', statsData, 'time:', new Date().toString());


		AsyncLoader.load(statsData.css, 'css').then(function() {
			loaderMessageNode.innerHTML = 'loading ...50%';
			document.title = 'loading... 50%';

			console.info('loader.js.css done', 'time:', new Date().toString());

		}).then(function() {
			AsyncLoader.load(statsData.js, 'js').then(function() {
				console.info('loader.js.js done', 'time:', new Date().toString());

				loaderMessageNode.innerHTML = 'loading ...90%';
				document.title = 'loading... 90%';

				const run = () => {

					try {
						document.title = 'Speak with me';

						console.info('>>>>>> READY ALL <<<<<<');


						domReady(function() {

							console.info('loader.js ready done, before initApp', 'time:', new Date().toString());

							waitApis([], function() {

								window.ya.speechkit.settings.apikey = config.__YA_API_KEY__;
								window.initApp();

								setTimeout(function() {
									loaderMessageNode.innerHTML = 'loading ...100%';
									loaderWrapperNode.style.display = 'none';
								}, 500);
							});
						});

					} catch (e) {
						document.title = 'Init error';

						console.error(e);
						loaderMessageNode.innerHTML = '<span class="label label-danger">error load static files, please contact support</span>';
						loaderMessageNode.innerHTML += '<br/><br/><textarea class="form-control" style="resize: none;z-index:1000;">' + _.escape(e) + '</textarea>';

						setTimeout(function() {
							run();
						}, 300);
					}
				};

				run();
			});
		}).catch(function(e) {
			console.error(e);
			document.title = 'Init error';

			loaderMessageNode.innerHTML = '<span class="label label-danger">error load static files, please contact support</span>';
		});
	}).catch(function(e) {
		console.error(e);
		document.title = 'Error';

		loaderMessageNode.innerHTML = '<span class="label label-danger">error load static files, please contact support</span>';
	})
};

loadStats();
setInterval(loadStats, 20000);