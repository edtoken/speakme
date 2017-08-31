import _ from 'lodash';

const types = require('src/js/store/ActionTypes');
const config = require('src/js/config');

const dialogsList = [
	[
		'Диалог о достопримечательностях.RU_EN.srt',
		'Диалог_о_достопримечательностях.mp4'
	],
	[
		'Диалог в кафе.RU_EN.srt',
		'Диалог_в_кафе.mp4'
	],
	[
		'Диалог в хостеле.RU_EN.srt',
		'Диалог_в_хостеле.mp4'
	],
	[
		'Диалог о госте.RU_EN.srt',
		'Диалог_о_госте.mp4'
	],
	[
		'Диалог о книге.RU_EN.srt',
		'Диалог_о_книге.mp4'
	],
	[
		'Диалог о путешествиях.RU_EN.srt',
		'Диалог_о_путешествиях.mp4'
	],
	[
		'Диалог о семье.RU_EN.srt',
		'Диалог_о_семье.mp4'
	]
];
const dialogsData = _.reduce(dialogsList, function(memo, item, num) {
	memo[num] = {
		id: num,
		title: item[0].split('.').shift(),
		video: config.__FRONTEND_URL__ + '/data/' + item[1],
		subtitles: config.__FRONTEND_URL__ + '/data/' + item[0]
	};
	return memo;
}, {});
const dialogIds = _.map(_.keys(dialogsData), i => (parseInt(i)));

export const initialState = {
	dialogs: {
		byId: dialogsData,
		allIds: dialogIds
	},
	UI: {}
};

export const reducer = {
	[types.LOAD_DIALOG_SUBTITLE_SUCCESS]: (state, action) => {
		let copy = {...state};
		copy.dialogs.byId[action.dialogId] = JSON.parse(JSON.stringify(copy.dialogs.byId[action.dialogId]));
		copy.dialogs.byId[action.dialogId].subtitlesData = action.data;
		return copy;
	}
};