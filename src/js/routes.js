import React, {Component} from 'react';
import {Switch, Route, HashRouter} from 'react-router-dom';

import {Provider} from 'react-redux';

import Layout from 'src/js/containers/layout/Layout';
import Page from 'src/js/containers/layout/Page';
import * as pages from 'src/js/containers/pages'
console.log(pages);
// const checkAccess = (nextState, replace, next) => {
//
// 	return next();
// };

const render = (props, PageComponent, HeaderComponent) => {
	return <Page headerComponent={HeaderComponent} {...props}>
		<PageComponent {...props}/>
	</Page>
};

export const createRoutes = (store, history) => {

	return (
		<Provider store={store}>
			<HashRouter history={history}>
				<Layout>
					<Switch>
						<Route exact
							   path="/"
							   render={(props) => (render(props, pages.Main.default))}/>
						<Route path="*" render={(props) => (render(props, pages.NotFound.default))}/>
					</Switch>
				</Layout>
			</HashRouter>
		</Provider>
	)
};
