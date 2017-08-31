import _ from 'lodash'
import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as dialogActions from 'src/js/store/actions/Dialogs';
import {getFile} from 'src/js/AsyncLoader';

const config = require('src/js/config');

const parseSRT = (data) => {
	function strip(s) {
		return s.replace(/^\s+|\s+$/g, "");
	}

	let subtitles = [];
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

			subtitles[cont] = {};
			subtitles[cont].number = n;
			subtitles[cont].start = i;
			subtitles[cont].end = o;
			subtitles[cont].text = t.split('\n');

		}
		cont++;
	}

	return subtitles;
};

const sngl = (cb) => {
	return (function() {
		var instance;

		function createInstance() {
			var object = cb();
			return object;
		}

		return {
			inst: function() {
				if (!instance) {
					instance = createInstance();
				}
				return instance;
			}
		};
	})();
};

const streamer = sngl(function() {
	return new ya.speechkit.SpeechRecognition();
});

const tts = sngl(function() {
	return new ya.speechkit.Tts(
		{
			emotion: 'good',
			speed: 1.5,
			speaker: 'jane'
		}
	);
});


class DialogMessageItem extends Component {
	constructor(props) {
		super(props);
		this.handlePlay = this.handlePlay.bind(this);
		this.handleSpeak = this.handleSpeak.bind(this);
		this.handleNext = this.handleNext.bind(this);
		this.handlePrev = this.handlePrev.bind(this);

		this.state = {
			speaking: 0,
			text: ""
		}
	}

	handlePlay(e) {
		const {subtitle} = this.props;
		this.props.handlePlay(subtitle.start, subtitle.end);
	}

	handleSpeak(e) {
		const self = this;
		const {speaking} = this.state;

		if (!speaking) {
			this.timer = function() {
				return setTimeout(function() {
					if (self.state.speaking > 1) {
						return self.setState({
							speaking: self.state.speaking - 1
						}, () => (self.timer()));
					}
					if (self.state.speaking === 1) {
						if (!window['webkitSpeechRecognition']) {
							streamer.inst().stop();
						}
						return self.setState({
							speaking: 0
						});
					}

				}, 1000);
			};
			this.timer();

			function startRecognizer() {
				if ('webkitSpeechRecognition' in window) {
					let recognition = new webkitSpeechRecognition();
					recognition.lang = 'en';

					recognition.onresult = function(event) {
						let result = event.results[event.resultIndex];
						let resultText = result[0].transcript.trim();

						self.setState({
							text: resultText
						})
					};

					recognition.onend = function() {
						console.log('Распознавание завершилось.');
						self.setState({
							speaking: 0
						});
					};

					recognition.start();
				} else {
					streamer.inst().start({
						lang: 'en-US',
						model: 'queries',
						// initCallback вызывается после успешной инициализации сессии.
						initCallback: function() {
							console.log("Началась запись звука.");
						},
						// Вызывается при возникновении ошибки (например, если передан неверный API-ключ).
						errorCallback: function(err) {
							console.log("Возникла ошибка: " + err);
						},
						// Будет вызвана после остановки распознавания.
						stopCallback: function() {
							console.log("Запись звука прекращена.");
						},
						dataCallback: function(text, done, merge, words, biometry) {
							console.log("Распознанный текст: " + text, done, merge, words, biometry);
							self.setState({
								text: text,
							})
						},
						particialResults: true,
						utteranceSilence: 60
					});

				}
			}

			startRecognizer();

			return this.setState({
				text: "",
				speaking: 5
			});
		}
	}

	_parseText(str) {
		let r = ['.', ',', '?', '!', '  '];

		str = str.toLowerCase();
		while (r.length) {
			str = str.split(r.pop()).join('');
		}

		str = str.trim();
		return str;
	}

	handlePrev(e) {
		const {pos} = this.props;
		this.props.handleOpen(pos - 1);
	}

	handleNext(e) {
		const {pos} = this.props;
		this.props.handleOpen(pos + 1);
	}

	render() {
		const {subtitle, isActive, pos, posLast} = this.props;
		const {speaking, text} = this.state;
		const speakingProcess = (speaking > 0);

		let checkSpeakWords = this._parseText(subtitle.text[0]).split(' ');
		let checkRealWords = (text) ? this._parseText(text).split(' ') : [];

		let checkedText = _.zip(checkSpeakWords, checkRealWords);

		checkedText = checkedText.map(function(w, i) {
			let isSuccess = (w[0] === w[1]);
			return <span
				key={'spw-' + w[0] + '-' + w[1] + i}><span
				className={'text text-' + (isSuccess ? 'success' : 'danger')}>{w[1] || w[0]}
				</span>&nbsp;
			</span>
		});

		return (<li className="list-group-item" style={{display: isActive ? 'block' : 'none'}}>

			{pos !== 0 && <span><button onClick={this.handlePrev}
										className="btn btn-xs btn-primary">prev</button>
				&nbsp;</span>}
			{subtitle.text[0]}&nbsp;&nbsp;
			<button onClick={this.handlePlay} className="btn btn-xs btn-success">play</button>
			&nbsp;&nbsp;
			{!speakingProcess && <span><button onClick={this.handleSpeak}
											   className="btn btn-xs btn-primary">speak</button>
				&nbsp;&nbsp;</span>}
			{speakingProcess &&
			<button onClick={this.handleSpeak} className="btn btn-xs btn-danger">stop speak {speaking}</button>}

			{pos !== posLast && <span><button onClick={this.handleNext} className="btn btn-xs btn-primary">next</button></span>}

			{text && <div>
				Распознанный текст: <span>{checkedText}</span>
			</div>}
		</li>)
	}
}
class DialogMessagesBody extends Component {

	constructor(props) {
		super(props);
		this.handleOpen = this.handleOpen.bind(this);

		this.state = {
			activeMessage: 0
		};
	}

	handleOpen(pos) {
		this.setState({activeMessage: pos});
	}

	render() {
		const self = this;
		const {dialogId, subtitles, handlePlay} = this.props;
		const hasMessages = (subtitles.length > 0);
		const {activeMessage} = this.state;
		const posLast = (hasMessages) ? subtitles.length - 1 : 0;

		return (<div>
			<ul className="list-group">
				{!hasMessages && <li className="list-group-item">empty</li>}
				{hasMessages && subtitles.map((m, i) => {
					const isActive = (activeMessage === i);
					return <DialogMessageItem
						key={'message-' + dialogId + '' + m.id + '' + i}
						pos={i}
						handleOpen={self.handleOpen}
						posLast={posLast}
						isActive={isActive}
						handlePlay={handlePlay}
						subtitle={m}/>
				})}
			</ul>
		</div>)
	}
}
class DialogItem extends Component {

	constructor(props) {
		super(props);
		this.handleToggleStart = this.handleToggleStart.bind(this);
		this.handlePlay = this.handlePlay.bind(this);
		this._checkProgress = this._checkProgress.bind(this);

		this.state = {
			progress: 0,
			subtitlesIsLoading: false,
			subtitles: []
		}
	}

	_update() {
		const {dialog, isActive} = this.props;
		const self = this;

		if (isActive) {
			this.setState({
				subtitlesIsLoading: true
			}, () => {
				getFile(dialog.subtitles).then(function(resp) {
					self.setState({
						subtitlesIsLoading: false,
						subtitles: parseSRT(resp)
					})
				});
			});

		}
	}

	componentDidMount() {
		this._update();
		this.timerProgress = this._checkProgress();
	}

	componentWillReceiveProps(nextProps) {
		this.props = nextProps;
		this._update();
	}

	componentWillUnmount() {
		clearTimeout(this.timerProgress);
	}

	componentWillUpdate() {
		const {isActive} = this.props;

		if (this.refs.video && !isActive) {
			this.refs.video.pause();
			this.refs.video.currentTime = 0;
		}
	}

	componentDidUpdate() {
		if (this.refs.video) {
			console.log('componentDidUpdate.LOAD');
			this.refs.video.load();
		}
	}


	_checkProgress() {
		const self = this;

		return setTimeout(function() {

			self.timerProgress = self._checkProgress();

			if (!self.refs.video) {
				return
			}

			let {duration, currentTime, _endTime} = self.refs.video;

			if (_endTime && currentTime >= _endTime) {
				self.refs.video.pause();
				self.refs.video._endTime = undefined;
				console.log('END pause', currentTime, _endTime);
			}

		}, 10);
	}

	handleToggleStart(e) {
		const {dialog, isActive} = this.props;

		if (isActive) {
			this.props.closeDialog(dialog.id);
		} else {
			this.props.openDialog(dialog.id);
		}
	}

	handlePlay(start, end) {
		start = start.split(',');
		end = end.split(',');


		let startData = start.shift().split(':');
		let startSeconds = ((+startData[0]) * 60 * 60 + (+startData[1]) * 60 + (+startData[2])) * 1000 + (start.length ? parseInt(start[0]) : 0);
		startSeconds = startSeconds / 1000;

		let endData = end.shift().split(':');
		let endSeconds = ((+endData[0]) * 60 * 60 + (+endData[1]) * 60 + (+endData[2])) * 1000 + (end.length ? parseInt(end[0]) : 0);
		endSeconds = endSeconds / 1000;

		console.log('a', start, end, 'startSeconds', startSeconds, 'endSeconds', endSeconds, this.refs.video);

		this.refs.video.currentTime = startSeconds;
		this.refs.video.play();
		this.refs.video._endTime = endSeconds
	}

	render() {
		const {dialog, isActive} = this.props;
		const {subtitlesIsLoading, subtitles, progress} = this.state;

		const titleProps = {
			style: {
				cursor: 'pointer'
			},
			onClick: this.handleToggleStart
		};

		return (<div className={isActive ? 'panel' : ''}>
			<div className={isActive ? 'panel-heading clearfix' : ''}>
				<h3 {...titleProps} className={isActive ? 'panel-title' : ''}>
					{!isActive && <i className="icon-right-open"/>}
					{isActive && <i className="icon-down-open"/>}
					{dialog.title}
				</h3>
			</div>

			{isActive && <div className="panel-body">
				<div className="embed-section">
					<div className="embed-responsive embed-responsive-16by9">
						<video ref="video" style={{minHeight: '150px'}}>
							<source src={dialog.video} type="video/mp4"/>
							Your browser does not support the video tag.
						</video>
						<div className="progress">
							<div style={{'width': progress + '%'}} className="progress-bar progress-bar-info"></div>
						</div>
					</div>
				</div>

				<br/>
				<div>
					{subtitlesIsLoading && <div><span className="label label-info">Loading...</span></div>}
					{!subtitlesIsLoading && <div>
						<DialogMessagesBody dialogId={dialog.id} subtitles={subtitles} handlePlay={this.handlePlay}/>
					</div>}
				</div>

			</div>}
		</div>)
	}
}

class DialogsListComponent extends Component {

	render() {
		const {dialogs, UI, openDialog, closeDialog} = this.props;
		const dialogProps = {
			openDialog,
			closeDialog
		};

		return (<div>
			{dialogs.allIds.map((dialogId, i) => {
				let isActive = (dialogId === UI.activeDialog);
				return (<DialogItem
					key={'dialog-' + dialogId + '' + i}
					{...dialogProps}
					isActive={isActive}
					dialog={dialogs.byId[dialogId]}/>);
			})}
		</div>)
	}
}

const DialogsList = connect(
	(state) => ({
		dialogs: state.Dialogs.dialogs,
		UI: state.Dialogs.UI
	}),
	(dispatch) => ({
		openDialog: (dialogId) => (dispatch(dialogActions.openDialog(dialogId))),
		closeDialog: (dialogId) => (dispatch(dialogActions.closeDialog(dialogId)))
	})
)(DialogsListComponent);

export default class Page extends Component {

	render() {
		return (<div>
			<div className="row">
				<div className="col-md-6 col-md-push-3">
					<div style={{padding: '60px 0 15px'}}>
						<h2 className="text-center">SpeakMe
							<small title={config.__BUILD_VERSION__} style={{fontSize: '40%'}}>
								v{config.__BUILD_VERSION__.toString().substr(-3)}</small>
						</h2>
						<hr/>
					</div>

					<DialogsList />

				</div>
			</div>
		</div>)
	}
}


(function() {
	var items = Array.prototype.slice.call(document.querySelectorAll('._a-table-body')).filter(item => (item.dataset.column === 'send_status'))
	var data = items.reduce(function(memo, item) {
		let n = item.parentNode;
		let node_lead_id = n.querySelector('[data-column="lead_id"]');
		let lead_id = node_lead_id.dataset.value.trim();
		memo[lead_id] = memo[lead_id] || [];
		memo[lead_id].push(item.dataset.value);
		return memo;
	}, {});
	let results = [];
	for (let lead_id in data) {
		if (data[lead_id].length !== 2) {
			results.push([].concat([lead_id], data[lead_id]).join(', '));
		}
	}
	console.log(results);
})();
