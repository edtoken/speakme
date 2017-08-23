import {render} from 'react-dom';
import {createRoutes} from './routes';

const createStore = require('src/js/store/utils/createStore').default;

const initApp = window.initApp = () => {

	const {store, history} = createStore();
	const routes = createRoutes(store, history);

	console.info('main.js.initApp', 'time:', new Date().toString());

	render(routes, document.getElementById('app-wrapper'));
};
