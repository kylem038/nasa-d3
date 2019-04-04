import * as d3 from 'd3';

const endpoint = 'https://data.nasa.gov/resource/y77d-th95.json';

document.addEventListener("DOMContentLoaded", function (event) {
    fetch(endpoint)
        .then((resp) => resp.json())
        .then((data) => {
            const parsedData = parseData(data);
            drawChart(parsedData);
        })
        .catch(function (err) { console.log(err); })
});

const parseData = parsedData => {
    return parsedData.map(impactData => {
        return {
            geolocation: impactData.geolocation,
            lat: impactData.reclat,
            long: impactData.reclong
        }
    })

}

const drawChart = parsedData => {
    console.log('draw chart');
    const svgWidth = 1200;
    const svgHeight = 800;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select('svg').attr('width', width).attr('height', height);
}