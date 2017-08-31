import React, {Component} from 'react';
import {Switch, Route, HashRouter, withRouter} from 'react-router-dom';

import {Provider, connect} from 'react-redux';

import Layout from 'src/js/containers/layout/Layout';
import Page from 'src/js/containers/layout/Page';
import * as pages from 'src/js/containers/pages'

const checkAccess = (nextState, replace, next) => {

	return next();
};

export const getHistory = () => {
	return getHistory.__HISTORY__;
};


class RedirectorComponent extends Component {

	constructor(props) {
		super(props);
		getHistory.__HISTORY__ = this.props.history;
	}

	render() {
		return null;
	}
}
const RedirectorRouter = withRouter(RedirectorComponent);

const render = (props, PageComponent, HeaderComponent) => {
	return <Layout>
		<Page headerComponent={HeaderComponent} {...props}>
			<PageComponent {...props}/>
			<RedirectorRouter />
		</Page>
	</Layout>
};

export const createRoutes = (store, history) => {

	return (
		<Provider store={store}>
			<HashRouter history={history}>
				<Switch>
					<Route exact
						   path="/"
						   render={(props) => (render(props, pages.Main.default))}
						   onEnter={checkAccess}/>
					<Route path="/dialog/:dialogId"
						   render={(props) => (render(props, pages.Dialog.default))}
						   onEnter={checkAccess}/>
					<Route path="*" render={(props) => (render(props, pages.NotFound.default))}/>
				</Switch>
			</HashRouter>
		</Provider>
	)
};
