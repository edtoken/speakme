const types = require('src/js/store/ActionTypes');

export const middleware = store => next => action => {

	let result = next(action);

	return result;
};