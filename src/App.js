import React, { Component } from 'react';
import { ReactiveBase, ReactiveComponent, SingleList, TextField, MultiDropdownList} from '@appbaseio/reactivesearch'

import ReactDOM from "react-dom";
import VisWrapper from './VisWrapper'

import './App.css'


class App extends Component {

	render() {
		return (
			<ReactiveBase
				app="dboe"
				url="http://localhost:9200"
				type="dboe-type">
				<div className="row">
					<div className="col">
						<div className="row">
							<TextField
								title="Main Lemma"
							  	componentId="LemmaTextField"
							  	dataField="main_lemma"
							  	placeholder="Type a lemma"
							  	showClear={true}
							 //  	customQuery={(value, props) => {
							 //  		console.log(value)
							 //  		value == '' ? "*" : value
							 //  		return {"bool": {
								//       	"must":
								//       		[{"query_string":
								//       			{"query":`main_lemma:${value}`,"analyze_wildcard":true,"default_field":"*"
								//       		}}]
								//     	}
								// 	}}
								// }
							/>
						</div>
						<div className="row">
							<TextField
								title="Sense"
							  	componentId="SenseTextField"
							  	dataField="sense"
							  	placeholder="Type a sense"
							  	showClear={true}
							/>
						</div>
						<div className="row">
							<MultiDropdownList
							  componentId="PosDropdown"
							  dataField="pos.keyword"
							  title="Grammatical form"
							/>
						</div>
					</div>
					<div className="col">
						<ReactiveComponent
							componentId="ReactiveComponentWrapper"
							defaultQuery={() => ({
								size: 10000,
								aggs: {
									municipalities: {
										terms: {
											field: 'gemeinde.keyword',
											size: 10000,
										},
										aggs: {
											questionnaire_number: {
												terms: {
													field: 'questionnaire_number.keyword',
												},
											}
										}
									},
									questionnaire_number: {
										terms: {
											field: 'questionnaire_number.keyword',
											size: 100000
										},
										aggs: {
											labels: {
												terms: {
													field: 'questionnaire_label.keyword',
												},
											}
										}
									}
								},
							})}
							react={{
						      "and": ["LemmaTextField", "SenseTextField", "PosDropdown"]
						    }}
						>
							<VisWrapper width={1200} height={800}/>

						</ReactiveComponent>
					</div>
				</div>
			</ReactiveBase>
		);
	}
}

export default App;