const _ = require('lodash');

import thunkMiddleware from "redux-thunk";
import {createBrowserHistory} from "history";

import {applyMiddleware, combineReducers, compose, createStore} from "redux";
import {routerMiddleware, routerReducer, syncHistoryWithStore} from "react-router-redux";
import {DevTools} from "./DevTools";

import {createReducer} from "./createReducer";

const reducers = require('src/js/store/reducers');
const config = require('src/js/config');

const commmonMiddleware = require('src/js/store/middleware');


export default () => {
	const hashHistory = createBrowserHistory();

	const readyReducers = _.reduce(reducers, function(memo, reducer, key) {
		memo[key] = createReducer(reducer.initialState, reducer.reducer);
		return memo;
	}, {});

	const rootReducer = combineReducers({
		...readyReducers,
		routing: routerReducer
	});

	const concatMiddleware = _.compact([
		// config.__DEVELOPMENT__ ? createLogger : false,
		thunkMiddleware,
		routerMiddleware(hashHistory)
	].concat(_.values(commmonMiddleware)));

	const store = createStore.apply(createStore, _.compact([
		rootReducer,
		config.__DEVELOPMENT__ ? DevTools.instrument() : false,
		compose(applyMiddleware.apply(applyMiddleware, concatMiddleware))
	]));

	const history = syncHistoryWithStore(hashHistory, store);

	console.info('createStore.js.readyReducers', readyReducers, 'time:', new Date().toString());
	console.info('createStore.js.store', store.getState(), 'time:', new Date().toString());

	return {store, history};
};