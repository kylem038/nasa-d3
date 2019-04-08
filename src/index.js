import * as d3 from 'd3';
import * as topojson from 'topojson';

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
            id: impactData.id,
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

    const path = d3.geoPath().projection(null);

    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    const svg = d3.select('body').append('svg').attr('width', svgWidth).attr('height', svgHeight);
    const features = svg.append('g');
    svg.append('rect').attr('class', 'nasa-geo-map').attr('width', svgWidth).attr('height', svgHeight).attr("transform", "translate(" + 20 + "," + 20 + ")")
        .call(zoom);;

    d3.json('https://d3js.org/us-10m.v1.json').then(
        (us) => {
            features.append("path")
                .datum(topojson.feature(us, us.objects.states))
                .attr("class", "state")
                .attr("d", path);

            features.append("path")
                .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
                .attr("class", "state-border")
                .attr("d", path)
                .style("stroke-width", "1.5px");

            features.append("path")
                .datum(topojson.mesh(us, us.objects.counties, function (a, b) { return a !== b && !(a.id / 1000 ^ b.id / 1000); }))
                .attr("class", "county-border")
                .attr("d", path)
                .style("stroke-width", ".5px");
        }
    ).catch(error => console.error(error));

    function zoomed() {
        const currentTransform = d3.event.transform;
        svg.attr("transform", currentTransform);
    }

    d3.select(self.frameElement).style("height", svgHeight + "px");
}