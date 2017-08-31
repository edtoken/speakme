const types = require('src/js/store/ActionTypes');
const store = require('src/js/store/utils/createStore').default;

import {getFile} from 'src/js/AsyncLoader';
import {getDialogById} from 'src/js/store/selectors/Dialogs';

const parseSRT = (data) => {
	function strip(s) {
		return s.replace(/^\s+|\s+$/g, "");
	}

	let list = [];
	let srt = data.replace(/\r\n|\r|\n/g, '\n');
	srt = strip(srt);

	let srt_ = srt.split('\n\n');
	let cont = 0;

	for (let s in srt_) {
		let st = srt_[s].split('\n');

		if (st.length >= 2) {
			let n = st[0];

			let i = strip(st[1].split(' --> ')[0]);
			let o = strip(st[1].split(' --> ')[1]);
			let t = st[2];

			if (st.length > 2) {
				for (let j = 3; j < st.length; j++) {
					t += '\n' + st[j];
				}
			}

			list[cont] = {};
			list[cont].number = n;
			list[cont].start = i;
			list[cont].end = o;
			list[cont].text = t.split('\n');

		}
		cont++;
	}

	return list;
};

export const getSubtitlesByDialogId = (dialogId) => {
	return (dispatch, getState) => {
		const dialog = getDialogById(getState(), dialogId);

		if (dialog.subtitlesData && dialog.subtitlesData.length) {
			// return dispatch({type: types.LOAD_DIALOG_SUBTITLE_SUCCESS, dialogId: dialogId, data: dialog.subtitlesData});
			return
		}

		getFile(dialog.subtitles).then(function(resp) {
			const subTitlesData = parseSRT(resp);
			dispatch({type: types.LOAD_DIALOG_SUBTITLE_SUCCESS, dialogId: dialogId, data: subTitlesData});
		});

	};
};
