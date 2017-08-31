import _ from 'lodash';
import React, {PropTypes, Component} from 'react';
import {getDialogById} from 'src/js/store/selectors/Dialogs';
import {getSubtitlesByDialogId} from 'src/js/store/actions/Dialogs';

import {connect} from 'react-redux';


class VideoPlayer extends Component {
	static ptopTypes = {
		src: PropTypes.string.isRequired
	};

	constructor(props) {
		super(props);
	}

	render() {
		const {src} = this.props;
		const wrapStyles = {
			position: 'relative'
		};

		return (<div style={wrapStyles}>
			<div className="embed-section">
				<div className="embed-responsive embed-responsive-16by9">
					<video ref="video" style={{minHeight: '150px', zIndex: 1}}>
						<source src={src} type="video/mp4"/>
						Your browser does not support the video tag.
					</video>
				</div>
			</div>
			{this.props.children}
		</div>)
	}
}

const SPEAKER = {
	recognition: undefined,

	start: (cb) => {
		if (!'webkitSpeechRecognition' in window) {
			return alert('Ваш браузер не поддерживается, поддерживается только Google Chrome (ПК версия)')
		}

		if (SPEAKER.recognition) {
			SPEAKER.stop();
			delete SPEAKER.recognition;
		}

		let resultText = undefined;

		SPEAKER.recognition = new webkitSpeechRecognition();
		SPEAKER.recognition.lang = 'en';
		// SPEAKER.recognition.lang = 'ru';

		SPEAKER.recognition.onresult = function(event) {
			let result = event.results[event.resultIndex];
			resultText = result[0].transcript.trim();
			console.log('resultText', resultText, event.results);
		};

		SPEAKER.recognition.onend = function() {
			console.log('Распознавание завершилось.');
			cb(resultText);
		};

		SPEAKER.recognition.start();
	},
	stop: () => {

	}
};

class DialogMessages extends Component {

	constructor(props) {
		super(props);
		this.state = {
			preview: true,
			resultText: '',
			messageNum: 0,
			speakTimer: 0
		};

		this.handleTogglePreview = this.handleTogglePreview.bind(this);
		this.handleRepeat = this.handleRepeat.bind(this);
		this.handleStartSpeak = this.handleStartSpeak.bind(this);
		this.handleStopSpeak = this.handleStopSpeak.bind(this);
		this.handlePrev = this.handlePrev.bind(this);
		this.handleNext = this.handleNext.bind(this);
	}

	componentWillMount() {
		const {dialog} = this.props;
		this.props.getSubtitlesByDialogId(dialog.id)
	}

	componentDidMount() {
		this.timerProgress = this._checkVideoProcess();
	}

	componentWillReceiveProps(nextProps) {
		this.props = nextProps;
	}

	handleTogglePreview() {

		if (this.state.preview) {
			this.handlePlay(this.state.messageNum);
		}

		this.setState({preview: !this.state.preview});
	}

	_checkVideoProcess() {
		const self = this;

		return setTimeout(function() {

			self.timerProgress = self._checkVideoProcess();

			if (!self.props.video()) {
				return
			}

			let {duration, currentTime, _endTime} = self.props.video();

			if (_endTime && currentTime >= _endTime) {
				self.props.video().pause();
				self.props.video()._endTime = undefined;
				console.log('END pause', currentTime, _endTime);
			}

		}, 10);
	}

	handleStartSpeak() {
		const self = this;

		this.setState({speakTimer: 8, resultText: ''});

		this.timer = function() {
			return setTimeout(function() {

				if (self.state.speakTimer > 0) {
					return self.setState({
						speakTimer: self.state.speakTimer - 1
					}, () => (self.timer()));
				}

				self.handleStopSpeak();

			}, 1000);
		};
		this.timer();

		SPEAKER.start((resultText) => {
			resultText = resultText ? resultText.trim() : false;

			self.setState({resultText: resultText});
			self.handleStopSpeak();
		});
	}

	handleStopSpeak() {
		this.setState({speakTimer: 0});
		SPEAKER.stop();
	}

	handlePlay(messageNum) {

		const {dialog} = this.props;
		const messages = dialog.subtitlesData;
		const message = messages[messageNum];

		const parseTime = (t) => {
			let d = t.split(',');
			let s = d.shift().split(':');
			let sec = ((+s[0]) * 60 * 60 + (+s[1]) * 60 + (+s[2])) * 1000 + (d.length ? parseInt(d[0]) : 0);
			return sec / 1000;
		};

		const start = parseTime(message.start);
		const end = parseTime(message.end);

		this.props.video().currentTime = start;
		this.props.video().play();
		this.props.video()._endTime = end;

		this.setState({
			messageNum: messageNum,
			resultText: ''
		});
	}

	handleRepeat() {
		this.handlePlay(this.state.messageNum);
	}

	handlePrev() {
		this.handlePlay(this.state.messageNum - 1);
	}

	handleNext() {
		this.handlePlay(this.state.messageNum + 1);
	}


	renderPreview() {
		const {dialog} = this.props;
		const wrapStyles = {
			color: '#fff',
			padding: '15px 30px'
		};

		return (<div style={wrapStyles}>
			<ul style={{margin: 0, padding: 0}}>
				{_.map(dialog.subtitlesData, (item, num) => {
					let text = item.text[0];
					return (<li key={'dialog-text-' + num + text}>{text}</li>)
				})}
			</ul>
			<div className="text-center">
				<br/>
				<button onClick={this.handleTogglePreview} className="btn btn-md btn-success">Начать упражнение</button>
			</div>
		</div>);
	}

	renderMessage() {
		const {dialog} = this.props;
		const messages = dialog.subtitlesData;
		const {speakTimer, resultText} = this.state;

		const wrapStyles = {
			color: "#fff"
		};
		const messageStyles = {
			height: '8rem',
			lineHeight: '8rem',
		};
		const resultTextStyles = {
			background: 'rgba(255,255,255,0.9)',
			position: 'absolute',
			bottom: '5px',
			width: '100%',
			fontSize: '1.3rem',
			lineHeight: 'normal'
		};

		const message = messages[this.state.messageNum];
		const messageText = message.text[0];
		const iconStyles = {
			cursor: 'pointer'
		};

		const isFirstMessage = (this.state.messageNum === 0);
		const isLastMessage = (this.state.messageNum === messages.length);

		const speakProcess = (speakTimer > 0);

		const prepareText = (str) => {
			let r = ['.', ',', '?', '!', '  '];

			str = str || '';
			str = str.toLowerCase();
			while (r.length) {
				str = str.split(r.pop()).join('');
			}

			str = str.trim();
			return str;
		};

		const messageCheckText = prepareText(messageText).split(' ');
		const resultCheckText = prepareText(resultText).split(' ');
		const checkedText = _.zip(messageCheckText, resultCheckText);
		const renderResult = (resultText !== '');

		let checkedTextList = checkedText.map(function(w, i) {
			let isSuccess = (w[0] === w[1]);
			return <span
				key={'spw-' + w[0] + '-' + w[1] + i}><span
				className={'text text-' + (isSuccess ? 'success' : 'danger')} title={w[0] || w[1]}>{w[1] || w[0]}
				</span>&nbsp;
			</span>
		});

		if (resultText === false) {
			checkedTextList = (<span className="text text-danger">Ошибка распознавания, говорите четче</span>)
		}

		return (<div style={wrapStyles}>
			<div className="row">
				<div className="col-xs-2">
					&nbsp;
					{!isFirstMessage &&
					<button onClick={this.handlePrev} className="btn btn-xs btn-warning">Вернутся</button>}
				</div>
				<div className="col-xs-8">
					<h2 style={messageStyles} className="text-center">
						{messageText}
						{speakProcess && <span className="text-warning">&nbsp;
							<b>({speakTimer}с.)</b>
						</span>}
						&nbsp;
						{!speakProcess && <span><i
							title="Повторить"
							onClick={this.handleRepeat}
							style={iconStyles}
							className="text-primary fa fa-play"/>&nbsp;</span>}
						{!speakProcess &&
						<span><i
							title="Произнести"
							style={iconStyles}
							onClick={this.handleStartSpeak}
							className="text-success fa fa-microphone"/>&nbsp;</span>
						}
						{speakProcess && <span><i
							title="Остановить"
							style={iconStyles}
							onClick={this.handleStopSpeak}
							className="text-warning fa fa-stop"/>&nbsp;</span>}


					</h2>
				</div>
				<div className="col-xs-2">
					{renderResult &&
					<button onClick={this.handleNext} className="btn btn-xs btn-warning">Дальше</button>
					}
					&nbsp;
				</div>
			</div>
			{renderResult &&
			<div style={resultTextStyles} className="text-center">
				{checkedTextList}
			</div>
			}
		</div>);
	}

	render() {
		const {preview} = this.state;

		const wrapStyles = Object.assign({
			position: 'absolute',
			left: 0,
			bottom: 0,
			right: 0,
			zIndex: 10,
			width: '100%',
		}, preview ? {
			overflowX: 'auto',
			height: '100%',
			background: 'rgba(0,0,0,0.8)'
		} : {
			height: '8rem',
			lineHeight: '8rem',
			background: 'rgba(0,0,0,0.5)'
		});

		const buttonWrapStyles = {
			position: 'absolute',
			bottom: '5px',
			right: '5px',
			zIndex: 11,
		};

		return (<div>

			<div className="text-right" style={buttonWrapStyles}>
				{preview &&
				<button onClick={this.handleTogglePreview} className="btn btn-sm btn-primary">спрятать диалог</button>
				}
				{!preview &&
				<button onClick={this.handleTogglePreview} className="btn btn-xs btn-primary">показать диалог</button>
				}
			</div>

			<div style={wrapStyles}>
				{preview && this.renderPreview()}
				{!preview && this.renderMessage()}
			</div>
		</div>)
	}
}

class DialogComponent extends Component {

	constructor(props) {
		super(props);
		this.getVideoTag = this.getVideoTag.bind(this);
	}

	getVideoTag() {
		return this.refs.player && this.refs.player.refs.video ? this.refs.player.refs.video : undefined;
	}

	render() {
		const {dialog, getSubtitlesByDialogId} = this.props;

		const titleWrapperStyles = {
			margin: '30px 0'
		};

		const backIconStyles = {
			fontSize: '2.5rem',
			marginLeft: '-2.5rem',
			cursor: 'pointer'
		};

		const backIcon = (
			<span style={backIconStyles}><a href="#"><i className="fa fa-arrow-circle-left"/></a>&nbsp;</span>);

		if (!dialog) {
			return (<div style={titleWrapperStyles}>{backIcon}Dialog not found</div>);
		}

		return (<div>
			<h1 style={titleWrapperStyles} className="text-center">{backIcon}{dialog.title}</h1>
			<VideoPlayer ref="player" src={dialog.video}>
				<DialogMessages
					video={this.getVideoTag}
					dialog={dialog}
					getSubtitlesByDialogId={getSubtitlesByDialogId}/>
			</VideoPlayer>
		</div>);
	}
}

const Dialog = connect(
	(state, props) => ({
		dialog: getDialogById(state, props.dialogId)
	}),
	(dispatch) => ({
		getSubtitlesByDialogId: (dialogId) => (dispatch(getSubtitlesByDialogId(dialogId)))
	})
)(DialogComponent);


export default class Page extends Component {

	render() {
		const {params} = this.props.match;
		const dialogId = parseInt(params.dialogId);

		return (<div>
			<div className="row">
				<div className="col-md-8 col-md-push-2">
					<Dialog dialogId={dialogId}/>
				</div>
			</div>
		</div>)
	}
}