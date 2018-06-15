import React, { Component } from "react"
import { geoPath, geoConicEqualArea } from "d3-geo"
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
    json("./municipalities-simple-topo.json")
      .then(geodata => {
          this.setState({
            worldData: feature(geodata, geodata.objects.municipalities),
        })
      })
    // this.createMap()
  }

  componentDidUpdate() {
    // this.createMap()
  }

  handleRegionHover(regionIndex) {
    console.log("Hovered on a region: ", this.state.worldData.features[regionIndex])
  }

  createMap() {


  }

  render() {
    if (this.state.worldData.length == 0) {
      return (<div> Loading...</div>)
    }
    const projection = geoConicEqualArea().parallels([40,50]).rotate([-13.8,0]).fitSize([this.props.width, this.props.height], this.state.worldData)
    const path = geoPath().projection(projection)
    let colorScale = () => {}
    if (this.props.aggregations) {
      colorScale = scaleSequential(interpolatePiYG).domain(extent(this.props.aggregations.municipalities.buckets, d => d.doc_count))
    }

    const applyColor = function(colorScale, d) {
      if (this.props.aggregations) {
        const item = this.props.aggregations.municipalities.buckets.filter(e => e.key == d.id).pop()
        return item ? colorScale(item.doc_count) : "white"
      } else return "white"
    }.bind(this)
    

    return (
      <svg width={this.props.width} height={this.props.height} viewBox={`0 0 ${this.props.width} ${this.props.height}`}>
        <g className="countries">
          {
            this.state.worldData.features.map((d,i) => (
              <path
                key={ `path-${ i }` }
                d={ path(d) }
                className="municipality"
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
