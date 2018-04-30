import React, { Component } from "react"
import { geoPath } from "d3-geo"
import { feature } from "topojson-client"
import { json } from "d3-fetch"

class CountryMap extends Component {
  constructor() {
    super()
    this.state = {
      worldData: [],
    }
  }
  componentDidMount() {
    json("./gemeinden-topo.json")
      .then(gemeindenData => {
          this.setState({
            worldData: feature(gemeindenData, gemeindenData.objects.gemeinden).features,
        })
      })
  }
  render() {
    const path = geoPath().projection(null)
    return (
      <svg width={ 960 } height={ 960 } viewBox="0 0 960 960">
        <g className="countries">
          {
            this.state.worldData.map((d,i) => (
              <path
                key={ `path-${ i }` }
                d={ path(d) }
                className="gemeinde"
                fill={ `rgba(38,50,56,${1 / this.state.worldData.length * i})` }
                stroke="#FFFFFF"
                strokeWidth={ 0.5 }
              />
            ))
          }
        </g>
      </svg>
    )
  }
}

export default CountryMap
