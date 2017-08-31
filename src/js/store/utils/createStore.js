const _ = require('lodash');

import thunkMiddleware from "redux-thunk";
import {createBrowserHistory} from "history";

import {applyMiddleware, combineReducers, compose, createStore} from "redux";
import {routerMiddleware, routerReducer, syncHistoryWithStore} from "react-router-redux";
import {DevTools} from "./DevTools";
import {createLogger} from 'redux-logger';

import {createReducer} from "./createReducer";
import {Singleton} from './Singleton';

const reducers = require('src/js/store/reducers');
const config = require('src/js/config');

const commmonMiddleware = require('src/js/store/middleware');

export const getHistory = function() {
	return getHistory.__HISTORY__;
};

export const getStore = function() {
	return getStore.__STORE__;
};

export default Singleton(() => {

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
		config.__DEVELOPMENT__ ? createLogger() : false,
		thunkMiddleware,
		routerMiddleware(hashHistory)
	].concat(_.values(commmonMiddleware)));

	const store = createStore.apply(createStore, _.compact([
		rootReducer,
		config.__DEVELOPMENT__ ? DevTools.instrument() : false,
		compose(applyMiddleware.apply(applyMiddleware, concatMiddleware))
	]));

	const history = syncHistoryWithStore(hashHistory, store);

	getHistory.__HISTORY__ = history;
	getStore.__STORE__ = store;

	console.info('createStore.js.readyReducers', readyReducers, 'time:', new Date().toString());
	console.info('createStore.js.store', store.getState(), 'time:', new Date().toString());

	return {store, history};

});