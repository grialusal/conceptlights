import React, { Component } from 'react'
import BubbleChart from '@weknow/react-bubble-chart-d3';


class BubbleGraph  extends Component {
	constructor(props) {
		super(props)
		this.createVis = this.createVis.bind(this)
	}

	componentDidMount() {
		this.createVis()
	}

	componentDidUpdate() {
		this.createVis()
	}

	createVis() {
		// const node = this.node
		// if (!this.props.questionnaires) return

		// const questionnaires = this.props.questionnaires.buckets.map(d => {
		// 	return { "id": d.key,
		// 			 "label": d.labels.buckets[0] ? d.labels.buckets[0].key : "unknown",
		// 			 "doc_count": d.doc_count
		// 			}
		// })

		// const packLayout = pack()
		// 					.size([this.props.width - 100, this.props.height - 100])
		// 					.padding(1.5)

		// const 


		// const grid = Grid().data(questionnaires)
		// 				.bands(true)
		// 				.size([this.props.width - 100, this.props.height - 100])
		// 				.padding([10, 10])
		// grid.layout()
		// console.log(grid.nodeSize())
		// console.log(questionnaires)

	
		// select(node)
		// 	.append("g")
		// 	.attr("transform", "translate(50,50)")
		// 	.selectAll("text.questionnaire")
		// 	.data(grid.nodes())
		// 	.enter()
		// 		.append("circle")
		// 		.attr("class", "questionnaire")
		// 		.attr("transform", d => `translate( ${d.x},${d.y} )`)
		// 		.attr("r", 20)

	}

	render () {

		if (!this.props.aggregations) {
			return (<div>Loading...</div>)
		}

		const data = this.props.aggregations.questionnaire_number.buckets.map(d => {
			return {
				label: d.key,
				value: d.doc_count
			}
		})

		return <BubbleChart
			graph={{
				zoom: 1,
				offsetX: 0,
    			offsetY: 0,

			}}
		    width={450}
		    height={450}
		    showLegend={false}
		    fontFamily="Arial"
		    data={data}
    	/>
	}
}

export default BubbleGraph