const types = require('src/js/store/ActionTypes');

export const openDialog = (dialog_id) => {
	return {
		type: types.OPEN_DIALOG,
		dialog_id
	};
};

export const closeDialog = (dialog_id) => {
	return {
		type: types.CLOSE_DIALOG,
		dialog_id
	};
};