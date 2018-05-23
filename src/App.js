import React, { Component } from 'react';
import { ReactiveBase, ReactiveComponent, SingleList, TextField } from '@appbaseio/reactivesearch'
import { ReactiveMap } from '@appbaseio/reactivemaps';

import ReactDOM from "react-dom";

import CountryMap from './CountryMap'

import './App.css'


class App extends Component {

	render() {
		return (
			<ReactiveBase
				app="dboe"
				url="http://localhost:9200"
				type="dboe-type"
				mapKey="AIzaSyAe92NwI94op_5edlU9AH0XzHOP2cSqh6M">
				<div className="row">
					<div className="col">
						<div className="row">
							<TextField
								title="Main Lemma"
							  	componentId="LemmaTextField"
							  	dataField="main_lemma"
							  	placeholder="Type a lemma"
							  	showClear={true}
							  	beforeValueChange={
								    function(value) {
								      // called before the value is set
								      // returns a promise
								      return new Promise((resolve, reject) => {
								        // update state or component props
								        resolve()
								        // or reject()
								      })
								    }
								  }
								onValueChange={
								    function(value) {
								      console.log("current value: ", value)
								      // set the state
								      // use the value with other js code
								    }
								  }
								onQueryChange={
								    function(prevQuery, nextQuery) {
								      // use the query with other js code
								      console.log('prevQuery', prevQuery);
								      console.log('nextQuery', nextQuery);
								    }
								  }
							/>
						</div>
						<div className="row">
							<SingleList
								title="Questionnaires"
								componentId="QuestionnaireList"
								dataField="questionnaire.keyword"
								size={10}
								showSearch={true}
								onValueChange={
								    function(value) {
								      console.log("current value: ", value)
								      // set the state
								      // use the value with other js code
								    }
								}
								onQueryChange={
								    function(prevQuery, nextQuery) {
								      // use the query with other js code
								      console.log('prevQuery', prevQuery);
								      console.log('nextQuery', nextQuery);
								    }
								}
							/>
						</div>
					</div>
					<div className="col">
						<ReactiveComponent
							componentId="CountryMap"
							defaultQuery={() => ({
								aggs: {
									gemeinde: {
										terms: {
											field: 'gemeinde.keyword',
											size: 1000,
										},
										aggs: {
											'questionnaire': {
												terms: {
													field: 'questionnaire_title.keyword',
												},
											}
										}
									},
								},
							})}
							react={{
						      "and": ["QuestionnaireList", "LemmaTextField"]
						    }}
						>
							<CountryMap />
						</ReactiveComponent>
					</div>
				</div>
			</ReactiveBase>
		);
	}
}

export default App;