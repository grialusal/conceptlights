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
		this.state = {nodes: [], links:[], filterLevel: 6}
		this.handleFilterLevelChange = this.handleFilterLevelChange.bind(this)
	}

	componentDidMount() {
		
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.aggregations) {
			console.log(nextProps.aggregations)
			const nodes = nextProps.aggregations.questionnaire_number.buckets
												.sort((a,b) => parseInt(a.key) - parseInt(b.key))

			let links = []

			nextProps.aggregations.question_concepts.buckets.forEach(d => {
				if(d.questionnaire_number.buckets.length > 1) {
					
					d.questionnaire_number.buckets.sort((a,b) => parseInt(a.key) - parseInt(b.key)).pairs(pair => {

						const linkIdx = links.findIndex(i => i.source == pair[0].key && i.target == pair[1].key)
						if (linkIdx == -1) {
							const link = {}
							link.source = pair[0].key
							link.target = pair[1].key
							link.key = link.source + ',' + link.target
							link.size = 1
							link.concepts = [d.key]
							links.push(link)
						} else {
							// console.log("repeat")
							links[linkIdx].size = links[linkIdx].size + 1 
							if (links[linkIdx].concepts.indexOf(d.key) == -1)
								links[linkIdx].concepts.push(d.key)

						}
					})
				}
			})

			this.setState({nodes: nodes, links: links})

		}
	} 


  	componentDidUpdate() {
		if(this.state.nodes.length > 0) {
			
			
			const nodeRadius = d3.scaleLinear().domain(d3.extent(this.state.nodes, d=> d.doc_count)).range([4, 30])
			const nodeColor = d3.scaleOrdinal(d3.schemeCategory20)

			
			const filteredLinks = this.state.links.filter(d => d.size > this.state.filterLevel)
			

			const simulation  = d3.forceSimulation()
							.force("link", d3.forceLink().id(d => d.key))
							.force("charge", d3.forceManyBody())
							.force("center", d3.forceCenter(this.props.width / 2, this.props.height / 2))


			const nodesGroup = d3.select(this.node).select('.nodes')
			const node = nodesGroup.selectAll("circle")
					.data(this.state.nodes, function(d) { return d.key })

			node.exit().remove()

			const newNode = node.enter().append("circle")
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
							}).merge(node)
			newNode.append("title")
				.text(d => {
					if (d.labels.buckets.length > 0)
						return `${d.labels.buckets[0].key} (${d.labels.buckets[0].doc_count} entries)`
					else return "Unknown"
			})


			const linkWidth = d3.scaleLinear().domain(d3.extent(filteredLinks, d => d.concepts.length)).range([1,4])
			

			const linksGroup = d3.select(this.node).select('.links')
			const link = linksGroup.selectAll("line")
				.data(filteredLinks, function (d) { return d.key })
			console.log(filteredLinks, link)
			
			link.exit().remove()

			const newLink = link.enter().append("line")
							.attr("stroke-width", d => linkWidth(d.concepts.length)).merge(link)			    	
						
			newLink.append("title")
				.text(d => d.concepts.join(','))

			

			simulation.nodes(this.state.nodes).on("tick", () => {
				newLink
			        .attr("x1", function(d) { return d.source.x; })
			        .attr("y1", function(d) { return d.source.y; })
			        .attr("x2", function(d) { return d.target.x; })
			        .attr("y2", function(d) { return d.target.y; });
				newNode
			        .attr("cx", function(d) { return d.x; })
			        .attr("cy", function(d) { return d.y; });
			})

			simulation.force("link")
      			.links(filteredLinks);
		}
		return false
	}

	handleFilterLevelChange(event) {
		this.setState({filterLevel: event.target.value})
	}
			
	render () {
		return (
			<div>
				<div className="controls">
						<input 
							type="number" 
							min="1" max="8" 
							value={this.state.filterLevel}
							onChange={this.handleFilterLevelChange}/>
				</div>
				<svg ref={node => this.node = node} width={this.props.width} height={this.props.height}>
				<g className="links"></g>
				<g className="nodes"></g>
				</svg>
				
			</div>
		)
	}

}

export default ForceGraph