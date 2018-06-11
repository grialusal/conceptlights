import React, { Component } from "react"
import CountryMap from './CountryMap'
import BubbleGraph from './BubbleGraph'

class VisWrapper extends Component {
	
	render () {
		if (!this.props.aggregations) {
			return (<div>Loading...</div>)
		}
		return (
			<div>
				<CountryMap 
					width={this.props.width / 2} 
					height={this.props.height} 
					municipalities={this.props.aggregations.municipalities} 
					hits={this.props.hits}
				/>

				<BubbleGraph 
					width={this.props.width / 1.5} 
					height={this.props.height} 
					questionnaires={this.props.aggregations.questionnaire_number} 
				/>
			</div>
		)
	}
}

export default VisWrapper