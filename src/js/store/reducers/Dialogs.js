const types = require('src/js/store/ActionTypes');
const config = require('src/js/config');

export const initialState = {
	dialogs: {
		byId: {
			0: {
				id: 0,
				title: 'Hello world',
				video: config.__FRONTEND_URL__ + '/data/Family_dialogue.mp4',
				subtitles: config.__FRONTEND_URL__ + '/data/Family_dialogue.RU_EN.srt'
			},
			1: {
				id: 1,
				title: 'About your life'
			}
		},
		allIds: [0, 1]
	},
	UI: {
		activeDialog: undefined
	}
};

export const reducer = {
	[types.OPEN_DIALOG]: (state, action) => ({
		...state,
		UI: {
			...state.UI,
			activeDialog: action.dialog_id
		}
	}),
	[types.CLOSE_DIALOG]: (state, action) => ({
		...state,
		UI: {
			...state.UI,
			activeDialog: undefined
		}
	})
};