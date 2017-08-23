import React, {Component} from 'react';
import {DevTools} from 'src/js/store/utils/DevTools'

const config = require('src/js/config');


export default class Layout extends Component {

	render() {
		return (
			<div className="page-container">
				{this.props.children}
				{config.__DEVELOPMENT__ ? <DevTools /> : null}
			</div>
		)
	}
}