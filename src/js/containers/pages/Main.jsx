import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as dialogActions from 'src/js/store/actions/Dialogs';
import {getFile} from 'src/js/AsyncLoader';


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

		this.state = {
			speaking: 0
		}
	}

	handlePlay(e) {
		const {subtitle} = this.props;

		tts.inst().speak(
			// Текст для озвучивания.
			subtitle.text[0],
			// Переопределяем настройки синтеза.
			{
				// Имя диктора.
				speaker: 'zahar',
				// Эмоции в голосе.
				emotion: 'neutral',
				// Функция-обработчик, которая будет вызвана по завершении озвучивания.
				stopCallback: function() {
					console.log("Озвучивание текста завершено.");
				}
			}
		)
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
						console.log('STOP t');
						streamer.inst().stop();
						return self.setState({
							speaking: 0
						});
					}

				}, 1000);
			};
			this.timer();

			// start speak
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
					console.log("Распознанный текст: " + text);
				},
				particialResults: true,
				utteranceSilence: 60
			});
			return this.setState({
				speaking: 5
			});
		}

		console.log('STOP b');

		this.setState({
			speaking: 0
		});
		streamer.inst().stop();
	}

	render() {
		const {subtitle} = this.props;
		const {speaking} = this.state;
		const speakingProcess = (speaking > 0);

		return (<li className="list-group-item">
			{subtitle.text[0]}&nbsp;&nbsp;
			<button onClick={this.handlePlay} className="btn btn-xs btn-success">play</button>
			{!speakingProcess && <span><button onClick={this.handleSpeak} className="btn btn-xs btn-primary">speak</button>&nbsp;&nbsp;</span>}
			{speakingProcess &&
			<button onClick={this.handleSpeak} className="btn btn-xs btn-danger">stop speak {speaking}</button>}
		</li>)
	}
}
class DialogMessagesBody extends Component {

	render() {
		const {dialog_id, subtitles} = this.props;
		const hasMessages = (subtitles.length > 0);

		return (<div>
			<ul className="list-group">
				{!hasMessages && <li className="list-group-item">empty</li>}
				{hasMessages && subtitles.map((m, i) => {
					return <DialogMessageItem
						key={'message-' + dialog_id + '' + m.id + '' + i} subtitle={m}/>
				})}
			</ul>
		</div>)
	}
}
class DialogItem extends Component {

	constructor(props) {
		super(props);
		this.handleToggleStart = this.handleToggleStart.bind(this);
		this.state = {
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
	}

	componentWillReceiveProps(nextProps) {
		this.props = nextProps;
		this._update();
	}

	handleToggleStart(e) {
		const {dialog, isActive} = this.props;

		if (isActive) {
			this.props.closeDialog(dialog.id);
		} else {
			this.props.openDialog(dialog.id);
		}
	}

	render() {
		const {dialog, isActive} = this.props;
		const {subtitlesIsLoading, subtitles} = this.state;

		const iconProps = {
			style: {
				cursor: 'pointer'
			},
			onClick: this.handleToggleStart
		};

		return (<div>
			<h3>
				{!isActive && <i {...iconProps} className="icon-right-open"/>}
				{isActive && <i {...iconProps} className="icon-down-open"/>}
				{dialog.title}
			</h3>
			{isActive && <div>
				<div className="embed-section">
					<div className="embed-responsive embed-responsive-16by9">
						<video controls style={{minHeight: '150px'}}>
							<source src={dialog.video} type="video/mp4"/>
							Your browser does not support the video tag.
						</video>
					</div>
				</div>

				<br/>
				<div>
					{subtitlesIsLoading && <div><span className="label label-info">Loading...</span></div>}
					{!subtitlesIsLoading && <div>
						<DialogMessagesBody dialog_id={dialog.id} subtitles={subtitles}/>
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
			{dialogs.allIds.map((dialog_id, i) => {
				let isActive = (dialog_id === UI.activeDialog);
				return (<DialogItem
					key={'dialog-' + dialog_id + '' + i}
					{...dialogProps}
					isActive={isActive}
					dialog={dialogs.byId[dialog_id]}/>);
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
		openDialog: (dialog_id) => (dispatch(dialogActions.openDialog(dialog_id))),
		closeDialog: (dialog_id) => (dispatch(dialogActions.closeDialog(dialog_id)))
	})
)(DialogsListComponent);

export default class Page extends Component {

	render() {
		return (<div>
			<div className="row">
				<div className="col-md-6 col-md-push-3">
					<div style={{padding: '60px 0 15px'}}>
						<h2 className="text-center">SpeakMe</h2>
						<hr/>
					</div>

					<DialogsList />

				</div>
			</div>
		</div>)
	}
}