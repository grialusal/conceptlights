import React, { Component } from "react"
import { geoPath } from "d3-geo"
import { feature } from "topojson-client"
import { json } from "d3-fetch"
import { scaleThreshold, scaleSequential } from "d3-scale"
import { extent } from "d3-array"
import { interpolatePiYG } from "d3-scale-chromatic"

class CountryMap extends Component {
  constructor(props) {
    super(props)
    this.state = {
      worldData: [],
    }
    this.createMap = this.createMap.bind(this)
    this.handleRegionHover = this.handleRegionHover.bind(this)
  }
  componentDidMount() {
    json("./gemeinden-topo.json")
      .then(gemeindenData => {
          this.setState({
            worldData: feature(gemeindenData, gemeindenData.objects.gemeinden).features,
        })
      })
    // this.createMap()
  }

  componentDidUpdate() {
    // this.createMap()
  }

  handleRegionHover(regionIndex) {
    console.log("Hovered on a region: ", this.state.worldData[regionIndex])
  }

  createMap() {
    // const nodeSelection = d3.select(this.node)
    // const colorScale = d3.scaleThreshold().domain(d3.extent(this.props.aggregations.gemeinde.buckets, d => d.doc_count))
    //                                       .range(d3.schemeBlues[9])
    // nodeSelection.append("g")
    //                 .attr("class", "gemeinde")
    //                 .attr("key", "gemeinde")
    //               selectAll("path")


  }

  render() {
    const path = geoPath().projection(null)
    console.log(this.props.hits, this.props.aggregations)
    let colorScale = () => {}
    if (this.props.aggregations) {
      colorScale = scaleSequential(interpolatePiYG).domain(extent(this.props.aggregations.gemeinde.buckets, d => d.doc_count))
    }

    const applyColor = function(colorScale, d) {
      if (this.props.aggregations) {
        const item = this.props.aggregations.gemeinde.buckets.filter(e => e.key == d.id).pop()
        return item ? colorScale(item.doc_count) : "white"
      } else return "white"
    }.bind(this)
    
    // return <svg ref={node => this.node = node} width={500} height={960}>

    // </svg>
    return (
      <svg width={ 960 } height={ 960 } viewBox="0 0 960 960">
        <g className="countries">
          {
            this.state.worldData.map((d,i) => (
              <path
                key={ `path-${ i }` }
                d={ path(d) }
                className="gemeinde"
                style = {{
                  fill : applyColor(colorScale, d),
                  stroke : "black",
                  strokeWidth : 0.5 
                }}
                onMouseOver={ () => this.handleRegionHover(i) }
              />
            ))
          }
        </g>
      </svg>
    )
  }
}

export default CountryMap
