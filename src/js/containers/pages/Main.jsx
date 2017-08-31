import React, {Component} from 'react';
import {connect} from 'react-redux';

const config = require('src/js/config');


class DialogsListComponent extends Component {

	render() {
		const {dialogs} = this.props;
		const openIcon = (
			<span style={{fontSize: '80%'}}>&nbsp;<i className="fa fa-arrow-circle-right"/></span>);

		return (<div>
			{dialogs.allIds.map((dialogId, i) => {
				return <a key={'home-dialog-' + dialogId + '-' + i} href={'#/dialog/' + dialogId}>
					<h3>{dialogs.byId[dialogId].title}{openIcon}</h3>
				</a>
			})}
		</div>)
	}
}

const DialogsList = connect(
	(state) => ({
		dialogs: state.Dialogs.dialogs,
		UI: state.Dialogs.UI
	}),
	(dispatch) => ({})
)(DialogsListComponent);

export default class Page extends Component {

	render() {
		return (<div>
			<div className="row">
				<div className="col-md-6 col-md-push-3">
					<DialogsList />
				</div>
			</div>
		</div>)
	}
}