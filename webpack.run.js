const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

const buildConfig = require('./src/js/config.build');

const WebpackDevServer = require('webpack-dev-server');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

process.env.APP_PORT = process.env.APP_PORT || 5080;
process.env.BACKEND_URL = process.env.BACKEND_URL || '';
process.env.RUN_ENVIRONMENT = process.env.NODE_ENV || 'production';
process.env.NODE_ENV = process.env.RUN_ENVIRONMENT;

process.env.FRONTEND_URL = process.env.FRONTEND_URL || process.env.NODE_ENV === 'development' ? 'http://localhost:5080' : '';

const PORT = parseInt(process.env.APP_PORT);
const isDevelopment = (process.env.NODE_ENV == 'development');
const BUILD_VERSION = new Date().getTime();
const PACKAGE_VERSION = pkg.version;

function getBuildRandomCacheString() {
	return _.range(_.random(60, 120)).join(_.sample(['', '-', '--', '---', '----']));
}

const htmlAddEntryPlugin = function() {
};
htmlAddEntryPlugin.prototype.apply = function(compiler) {
	compiler.plugin("compilation", function(compilation) {
		compilation.plugin('html-webpack-plugin-after-html-processing', function(htmlPluginData, cb) {
			if (htmlPluginData.plugin.options.filename === 'index.html' && isDevelopment) {
				htmlPluginData.html = htmlPluginData.html.split('{{ BUILD_HASH }}').join(compilation.hash);
				htmlPluginData.html = htmlPluginData.html.split('{{ BUILD_VERSION }}').join(BUILD_VERSION);
			}
			cb(null, htmlPluginData);
		});
	});
};

let CONFIG = {
	context: path.resolve(__dirname, './src'),
	watch: isDevelopment,
	stats: true,
	devtool: (isDevelopment) ? 'source-map' : 'source-map',
	entry: Object.assign({
		loader: ['./js/loader.js'],
		main: ['./js/main.js'],
		react: [
			'react',
			'react-dom',
			'react-router',
			'react-router-dom'
		],
		redux: [
			'redux',
			'react-redux',
			'redux-thunk',
			'react-router-redux'
		],
		vendor: [
			'lodash',
			'axios',
			'socket.io-client',
			'moment',
			'valid.js',
			'qs',
			'chart.js',
			'react-chartjs'
		]
	}, !isDevelopment ? {
		style: [
			'../theme/css/bootstrap.css',
			'../theme/css/entypo.css',
			'../theme/css/font-awesome.min.css',
			'../theme/sass/integral-core.scss',
			'../src/scss/style.scss'
		],
	} : {}),
	output: {
		publicPath: isDevelopment ? '/' : '/',
		path: path.resolve(__dirname, './dist'),
		filename: '[name].[hash].bundle.js'
	},
	resolve: {
		extensions: ['.json', '.js', '.jsx'],
		alias: {
			src: path.resolve(__dirname, './src'),
			// js: path.resolve(__dirname, './src/js'),
			// components: path.resolve(__dirname, './src/js/components'),
			// containers: path.resolve(__dirname, './src/js/containers'),
			// locale: path.resolve(__dirname, './src/js/locale'),
			// store: path.resolve(__dirname, './src/js/store')
		}
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: [/node_modules/, /theme/],
				use: [{
					loader: 'babel-loader',
					options: {
						presets: [
							'es2015',
							'stage-0',
							'react'
						]
					}
				}]
			},
			{
				test: /\.jsx$/,
				exclude: [/node_modules/, /theme/],
				use: [{
					loader: 'babel-loader',
					options: {
						presets: [
							'es2015',
							'stage-0',
							'react'
						]
					}
				}]
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.(sass|scss)$/,
				use: [
					'style-loader',
					'css-loader',
					'sass-loader'
				]
			},
			{
				test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{loader: 'url-loader', options: {'limit': 10000, 'mimetype': 'application/font-woff'}}
				]
			},
			{
				test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{loader: 'url-loader', options: {'limit': 10000, 'mimetype': 'application/octet-stream'}}
				]
			},
			{
				test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{loader: 'file-loader'}
				]
			},
			{
				test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{loader: 'url-loader', options: {'limit': 10000, 'mimetype': 'image/svg+xml'}}
				]
			},
			{
				test: /\.(jpe?g|png|gif|svg)$/i,
				use: [
					{loader: 'file-loader', options: {'name': '[name].[ext]'}}
				]
			},
			{test: /\.srt$/, loader: 'raw-loader!srt-loader'}
		]
	},
	plugins: [
		// new webpack.NormalModuleReplacementPlugin(
		// 	/createBrowserHistory/,
		// 	require.resolve("./node_modules/react-router/lib/createMemoryHistory.js")
		// ),
		new CleanWebpackPlugin([path.resolve(__dirname, './dist')], {
			root: path.resolve(__dirname, './src'),
			verbose: true,
			dry: false
		}),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"' + process.env.NODE_ENV + '"'
			}
		}),
		// new ExtractTextPlugin("bundle.[name].[hash].css"),
		new StatsWriterPlugin({
			transform: function(data, opts) {
				data.BUILD_HASH = opts.compiler.hash;
				data.BUILD_VERSION = BUILD_VERSION;
				return JSON.stringify(data, null, 2);
			}
		}),
		new htmlAddEntryPlugin(),
		new HtmlWebpackPlugin({
			// hash: true,
			title: "INIT_TITLE",
			favicon: './img/favicon.png',
			filename: 'index.html',
			template: './index.html',

			BUILD_HASH: "{{ BUILD_HASH }}",
			// BUILD_VERSION: isDevelopment ? BUILD_VERSION : "{{ BUILD_VERSION }}",
			BUILD_VERSION: BUILD_VERSION,
			// PACKAGE_VERSION: isDevelopment ? PACKAGE_VERSION : "{{ PACKAGE_VERSION }}",
			PACKAGE_VERSION: PACKAGE_VERSION,

			// BACKEND_URL: isDevelopment ? process.env.BACKEND_URL : '{{ BACKEND_URL }}',
			BACKEND_URL: process.env.BACKEND_URL,
			// FRONTEND_URL: isDevelopment ? process.env.FRONTEND_URL : '{{ FRONTEND_URL }}',
			FRONTEND_URL: process.env.FRONTEND_URL,
			// RUN_ENVIRONMENT: isDevelopment ? process.env.RUN_ENVIRONMENT : '{{ RUN_ENVIRONMENT }}',
			RUN_ENVIRONMENT: process.env.RUN_ENVIRONMENT,
			// NODE_ENV: isDevelopment ? process.env.NODE_ENV : '{{ NODE_ENV }}',
			NODE_ENV: process.env.NODE_ENV,

			RANDOM_CACHE_STRING: getBuildRandomCacheString(),
			chunks: buildConfig.__BUILD_CHUNKS__
		})
	]
};

if (!isDevelopment) {
	CONFIG.plugins.push(new webpack.optimize.UglifyJsPlugin({
		minimize: true,
		compress: {
			sequences: true,
			dead_code: true,
			conditionals: true,
			booleans: true,
			unused: true,
			if_return: true,
			join_vars: true,
			drop_console: true,
			warnings: false
		},
		mangle: {
			except: ['$super', '$', 'exports', 'require']
		},
		output: {
			comments: false
		}
	}));
}

if (isDevelopment) {
	// CONFIG.plugins.push(new webpack.HotModuleReplacementPlugin());
	CONFIG.plugins.push(new CopyWebpackPlugin([{from: __dirname + '/theme', to: 'theme'}]));
	CONFIG.plugins.push(new CopyWebpackPlugin([{from: __dirname + '/src/data', to: 'data'}]));

	// CONFIG.entry['loader'].unshift("webpack/hot/only-dev-server");
	CONFIG.entry['loader'].unshift("webpack-dev-server/client?http://localhost:" + PORT);

	CONFIG.devServer = {
		historyApiFallback: {
			historyApiFallback: {
				index: process.env.FRONTEND_URL + '/index.html'
			},
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
			}
		}
	};
}

console.info('>>>> CONFIG START <<<<');
console.info(CONFIG);
console.info('>>>> CONFIG END <<<<');

if (isDevelopment) {
	const server = new WebpackDevServer(webpack(CONFIG), {
		// publicPath: '/dist/',
		inline: true,
		// hot: true,
		quiet: false,
		noInfo: true,
		stats: {colors: true},
		port: 5080
	});
	server.listen(PORT);
	console.info(`WebpackDevServer run on port: ${PORT}`);

	// const exec = require('child_process').exec;
	// exec('./node_modules/nodemon/bin/nodemon.js mock.server.js',
	// 	function(error, stdout, stderr) {
	// 		console.log('stdout: ' + stdout);
	// 		console.log('stderr: ' + stderr);
	// 		if (error !== null) {
	// 			console.log('exec error: ' + error);
	// 		}
	// 	});

	return CONFIG;
}


webpack(CONFIG).run(function(error, stats) {
	if (error) { // so a fatal error occurred. Stop here.
		console.error(error);
		return 1;
	}

	const jsonStats = stats.toJson();

	if (jsonStats.hasErrors) {
		return jsonStats.errors.map((error) => console.error(error));
	}

	if (jsonStats.hasWarnings) {
		jsonStats.warnings.map((warning) => console.warn(warning));
	}

	console.info(`Webpack stats: ${stats}`);
	console.info('Your app is compiled in production mode in /dist. It\'s ready to roll!');

	return 0;
});


