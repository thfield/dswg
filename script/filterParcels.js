'use strict'
const fs = require('fs');
const _ = require('lodash');
// const turf = require('turf');

let inputFile = 'raw/j2j3-acqj.json',
    inputData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

let parcelFile = 'raw/allParcels.geojson',
// let parcelFile = 'someParcels.geo.json',
    parcelData = JSON.parse(fs.readFileSync(parcelFile, 'utf8'));

let outputFile = "filteredParcels.geo.json",
    outputData = {};


let re = /\//
let arr = inputData.map(bldg => { return bldg.parcel_s.replace(re, '') });

parcelData.features = _.filter(parcelData.features, function(feature){
  return _.some(arr, function(el){ return el === feature.properties.BLKLOT })
})


writeToFile(parcelData, outputFile);
// writeToFile(arr, 'parcelsInDataset.json');

function writeToFile(obj, filename){
  fs.writeFile(filename, JSON.stringify(obj), function(err) {
    if(err) {
      console.log('error saving document', err)
    } else {
      console.log('File saved as ' + filename)
    }
  })
}

// topojson -o parcels.topo.json --id-property BLKLOT -p --simplify-proportion .8 filteredParcels.geo.json