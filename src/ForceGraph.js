import React, { Component } from 'react'
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';

Array.prototype.pairs = function (func) {
    for (var i = 0; i < this.length - 1; i++) {
        for (var j = i; j < this.length - 1; j++) {
            func([this[i], this[j+1]]);
        }
    }
}


class ForceGraph extends Component {

	constructor(props) {
		super(props)
		this.state = {nodes: [], links:[]}
	}

	componentDidMount() {
		
	}



  	shouldComponentUpdate(nextProps) {
		if(nextProps.aggregations) {
			const d3Graph = d3.select(this.node)
			console.log(nextProps.aggregations)
			const nodes = nextProps.aggregations.questionnaire_number.buckets
												.sort((a,b) => parseInt(a.key) - parseInt(b.key))

			
			let links = []
			let number = 0
			nextProps.aggregations.question_concepts.buckets.forEach(d => {
				if(d.questionnaire_number.buckets.length > 1) {
					// d.questionnaire_number.buckets.sort((a,b) => parseInt(a.key) - parseInt(b.key)).forEach(d => {
					// 	const link = {}
					// 	link.source 
					// 	link.target
					// 	link.key
					// 	link.size 	
					// })
					number++
					d.questionnaire_number.buckets.sort((a,b) => parseInt(a.key) - parseInt(b.key)).pairs(pair => {

						const linkIdx = links.findIndex(i => i.source == pair[0].key && i.target == pair[1].key)
						if (linkIdx == -1) {
							const link = {}
							link.source = pair[0].key
							link.target = pair[1].key
							link.key = link.source + ',' + link.target
							link.size = 1
							links.push(link)
						} else {
							// console.log("repeat")
							links[linkIdx].size = links[linkIdx].size + 1 
						}
					})
				}
			})

			const nodeRadius = d3.scaleLinear().domain(d3.extent(nodes, d=> d.doc_count)).range([2, 20])
			const nodeColor = d3.scaleOrdinal(d3.schemeCategory20)


			// this.setState({nodes: nodes, links: links})
			
			links = links.filter(d => d.size > 6)

			const simulation  = d3.forceSimulation()
							.force("link", d3.forceLink().id(d => d.key))
							.force("charge", d3.forceManyBody().strength(-5))
							.force("center", d3.forceCenter(this.props.width / 2, this.props.height / 2))

			console.log(nodes)
		

			const link = d3Graph.append("g")
					.attr("class", "links")
				    .selectAll("line")
				    .data(links)
				    .enter().append("line")
				      .attr("stroke-width", 1);

			const node = d3Graph.append("g")
					.attr("class", "nodes")
					.selectAll("circle")
					.data(nodes)
					.enter().append("circle")
					.style("fill", (d,i) => nodeColor(i) )
					.attr("r", d => nodeRadius(d.doc_count))
					.call(d3.drag()
							.on("start", d => {
								if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
						            d.fx = d.x;
						            d.fy = d.y;
							}))
							.on("drag", d => {
								d.fx = currentEvent.x;
            					d.fy = currentEvent.y;
							})
							.on("end", d => {
								if (!currentEvent.active) simulation.alphaTarget(0);
									d.fx = null;
								  	d.fy = null;
							})
			node.append("title")
				.text(d => {
					if (d.labels.buckets.length > 0)
						return `${d.labels.buckets[0].key} (${d.labels.buckets[0].doc_count} entries)`
					else return "Unknown"
			})

			simulation.nodes(nodes).on("tick", () => {
				link
			        .attr("x1", function(d) { return d.source.x; })
			        .attr("y1", function(d) { return d.source.y; })
			        .attr("x2", function(d) { return d.target.x; })
			        .attr("y2", function(d) { return d.target.y; });
				node
			        .attr("cx", function(d) { return d.x; })
			        .attr("cy", function(d) { return d.y; });
			})

			simulation.force("link")
      			.links(links);
		}
		return false
	}

			

			



	render () {
		return (
			<svg ref={node => this.node = node} width={this.props.width} height={this.props.height}>
				
			</svg>
		)
	}

}

export default ForceGraph