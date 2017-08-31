import React, {Component} from 'react';

const config = require('src/js/config');

export default class Page extends Component {

	render() {
		const buildVersion = config.__BUILD_VERSION__.toString();
		const version = [
			buildVersion.substr(0, 1),
			buildVersion.substr(buildVersion.length / 2, 1),
			buildVersion.substr(-3)
		].join('.');

		const isHomePage = (this.props.match && this.props.match.path === '/');
		const headStyles = (isHomePage) ? {padding: '60px 0 30px'} : {padding: '10px 0 0', fontSize: '1rem'};

		return (<div>
			<div className="container">

				<div className="row">
					<div className="col-md-6 col-md-push-3">

						<div style={headStyles}>
							<h2 className="text-center" style={{margin: 0}}>SpeakMe&nbsp;
								<small
									title={config.__BUILD_VERSION__}
									style={{fontSize: '40%'}}>
									v{version}</small>
							</h2>
							<hr style={{margin: '10px'}}/>
						</div>
					</div>
				</div>

				{this.props.children}
			</div>
		</div>)
	}
}