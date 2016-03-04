// (function() {
  'use strict'

  // tooltip methods
  let tt = {
    init: function(element){
      d3.select(element).append('div')
          .attr('id', 'tooltip')
          .attr('class', 'hidden')
        .append('span')
          .attr('class', 'value')
    },
    follow: function(element, caption, options) {
      element.on('mousemove', null);
      element.on('mousemove', function() {
        let position = d3.mouse(document.body);
        d3.select('#tooltip')
          .style('top', ( (position[1] + 30)) + "px")
          .style('left', ( position[0]) + "px");
        d3.select('#tooltip .value')
          .html(caption);
      });
      d3.select('#tooltip').classed('hidden', false);
    },
    hide: function() {
      d3.select('#tooltip').classed('hidden', true);
    }
  }




  let margin = {top: 0, left: 40, bottom: 40, right: 0},
      width = 600;
      // width = parseInt(d3.select('#map_container').style('width'))
      // width = window.getComputedStyle(document.getElementById("map_container"), null).getPropertyValue("width"),
      // width = width - margin.left - margin.right
  let mapRatio = 1,
      height = width * mapRatio,
      scaleMultiplier = 400 // TODO: set this programmitically with bounding box from turf

  let mapsvg = d3.select('#map_container').append('svg')
      .attr('height', height)
      .attr('id','map')

  let colorMap = d3.map(),
      keymap = []

  let quantize = d3.scale.quantize()
      .range(d3.range(9).map(function(i) { return 'q' + i + '-9' }))

  let prettify = d3.format(".01f")

  // let tiler = d3.geo.tile()
  //     .size([width, height])

  let projection = d3.geo.mercator()
      .center([-122.45245539639117,37.76579652110185])
      .scale(width*scaleMultiplier)
      .translate([width / 2, height / 2])

  var zoom = d3.behavior.zoom()
      .translate([0, 0])
      .scale(1)
      .scaleExtent([1, 10])
      .on("zoom", zoomed);

  let path = d3.geo.path()
      .projection(projection)

  mapsvg.append('g')
      .attr('class', 'geoBoundaries')

  mapsvg.call(zoom)

  tt.init('body')


  function zoomed() {
    var g = d3.select('#map_container .geoBoundaries');
    g.style("stroke-width", 1 / d3.event.scale + "px");
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
let defaultData = {};

  // download data and draw map
  d3_queue.queue()
    .defer(d3.json, 'data/parcels.topo.json')
    .defer(d3.json, 'data/apiresult.json')
    .await(renderFirst)

  function renderFirst(error, geo, data) {
    let re = /\//
    data.forEach(bldg => { return bldg.parcel_s = bldg.parcel_s.replace(re, '') });

    defaultData = {
      rawData: data,
      boundary: 'parcel',
      topo: topojson.feature(geo, geo.objects['filteredParcels.geo']).features
    }

    mapsvg.call(renderGeo, defaultData);
    updateGeo(defaultData, '_2014_energy_star_score');
  };


  function renderGeo(svg, dataset){
    d3.select('.geoBoundaries')
      .selectAll('.' + dataset.boundary)
        .data(dataset.topo)
      .enter().append('path')
        .attr('class', dataset.boundary)
        .attr('d', path)
        .on('mouseover', function(d) {
          let me = d3.select(this),
              value = colorMap.get(d.id),
              thisText = `${d.properties.FROM_ST}-${d.properties.TO_ST} ${d.properties.STREET} ${d.properties.ST_TYPE}<br>parcel id: ${d.id} <br> value: ${prettify(value)}`
          tt.follow(me, thisText)
          // return setTitle(value)
        })
        .on("mouseout", tt.hide )
  }

  function updateGeo(dataset, param){
      keymap.length = 0;
      keymap = dataset.rawData.map((boundary)=>{
        colorMap.set(boundary.parcel_s, +boundary[param]);
        return +boundary[param];
      })
      let domain = d3.extent(keymap);
      let reverse = true;
      if(reverse){ domain = [domain[1], domain[0]] };
      quantize.domain(domain);

      let boundaries = mapsvg.select('.geoBoundaries').selectAll('.'+ dataset.boundary)
      boundaries
        .attr('class', function(d){
          return dataset.boundary+ ' ' + quantize(colorMap.get(d.id))
        });
    }



  function setTitle(newTitle){
    d3.select('#selected-title').text(newTitle);
  }


// })()