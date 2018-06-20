import React, { Component } from 'react';
import { ReactiveBase, ReactiveComponent, SingleList, TextField, MultiDropdownList} from '@appbaseio/reactivesearch'

import ReactDOM from "react-dom"

import VisWrapper from './VisWrapper'
import CountryMap from './CountryMap'
import ForceGraph from './ForceGraph'
import BubbleGraph from './BubbleGraph'

import './App.css'


class App extends Component {

	render() {
		return (
				<ReactiveBase
					app="dboe"
					url="http://localhost:9200"
					type="dboe-type">
					<div className="container">
						<div className="header">Header</div>
						<div className="searchbar">
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

							<TextField
								title="Sense"
							  	componentId="SenseTextField"
							  	dataField="sense"
							  	placeholder="Type a sense"
							  	showClear={true}
							/>
					
							<MultiDropdownList
							  componentId="PosDropdown"
							  dataField="pos.keyword"
							  title="Grammatical form"
							/>

							<ReactiveComponent 
								componentId="BubbleSelector"
								defaultQuery={() => ({
									aggs: {
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
								
								<BubbleGraph/>
							</ReactiveComponent>
						</div>

						<div className="main">
							<ReactiveComponent
								componentId="MapComponentWrapper"
								defaultQuery={() => ({
									size: 10000,
									aggs: {
										municipalities: {
											terms: {
												field: 'gemeinde.keyword',
												size: 10000,
											}
										}
									},
								})}
								react={{
							      "and": ["LemmaTextField", "SenseTextField", "PosDropdown"]
							    }}>
								<CountryMap width={1400} height={450}/>
							</ReactiveComponent>
							<ReactiveComponent
								componentId="ForceComponentWrapper"
								defaultQuery={() => ({
									
									size: 10000,
									aggs: {
										questionnaire_number: {
											terms: {
												field: 'questionnaire_number.keyword',
												size: 10000
											},
											aggs: {
												labels: {
													terms: {
														field: 'questionnaire_label.keyword',
													},
												}
											}
										},
										question_concepts: {
											terms: {
												field: 'question_concepts.keyword',
												size: 10000,
											},
											aggs: {
												questionnaire_number: {
													terms: {
														field: 'questionnaire_number.keyword',
													}
												}
											}
										}
									},
								})}
								react={{
							      "and": ["LemmaTextField", "SenseTextField", "PosDropdown"]
							    }}>
								<ForceGraph width={1400} height={300}/>
							</ReactiveComponent>
						</div>
						<div className="footer">Footer</div>
					</div>
				</ReactiveBase>
		);
	}
}

export default App;