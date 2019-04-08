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
    // Set width and height of svg
    const svgWidth = 900;
    const svgHeight = 500;
    const scale = 153;

    // Set initial variables for zooming / panning
    let initX;
    let mouseClicked = false;
    let s = 1;
    let rotated = 90;

    //need to store this because on zoom end, using mousewheel, mouse position is NAN
    let mouse;

    const projection = d3.geoMercator()
        .scale(scale)
        .translate([svgWidth / 2, svgHeight / 1.5]);

    const path = d3.geoPath().projection(projection);

    const worldJSON = 'https://unpkg.com/world-atlas@1/world/110m.json';

    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed)
        .on('end', zoomended);

    const svg = d3.select('body').append('svg').attr('width', svgWidth).attr('height', svgHeight).on('wheel', function () {
        // zoomend needs mouse coords
        initX = d3.mouse(this)[0];
    }).on('mousedown', function () {
        // only if scale === 1
        if (s !== 1) return;
        initX = d3.mouse(this)[0];
        mouseClicked = true;
    }).call(zoom);

    const g = svg.append('g');
    // Need to append containers in this order or the dots sit behind the map
    g.append('g').attr('class', 'boundary-container');
    g.append('g').attr('class', 'points-container');
    function rotateMap(endX) {
        projection.rotate([rotated + (endX - initX) * 360 / (s * svgWidth), 0, 0]);
        g.selectAll('path').attr('d', path);
    }

    function zoomed() {
        // Capture transform as list
        let t = [d3.event.transform.x, d3.event.transform.y];
        // Reassign s to be value of k, which is the current zoom scale
        s = d3.event.transform.k;
        // Create height var
        let h = 0;

        // We want x to be the minimum value between the current zoom and the aspect ratio, the width * the zoom, or the current x
        t[0] = Math.min((svgWidth / svgHeight) * (s - 1), Math.max(svgWidth * (1 - s), t[0]));

        // We want the y to be the min value of 0, the height minus the aspect ratio, or current y
        t[1] = Math.min(h * (s - 1) + h * s, Math.max(svgHeight * (1 - s) - h * s, t[1]));

        g.attr('transform', `translate(${t})scale(${s})`);
        d3.selectAll(".boundary").style("stroke-width", 1 / s);
        d3.selectAll('.point').attr('r', 0.01 / s);

        mouse = d3.mouse(this);

        if (s === 1 && mouseClicked) {
            rotateMap(mouse[0]);
            return;
        }
    }

    function zoomended() {
        if (s !== 1) return;
        rotated = rotated + ((mouse[0] - initX) * 360 / (s * svgWidth));
        mouseClicked = false;
    }

    d3.json(worldJSON).then(
        (world) => {
            g.select('.boundary-container').append("g")
                .attr("class", "boundary")
                .selectAll("boundary")
                .data(topojson.feature(world, world.objects.countries).features)
                .enter().append("path")
                .attr("d", path);
        }
    ).catch(error => console.error(error));

    // Add points to the map with NASA data
    parsedData.forEach(point => {
        if (isNaN(point.long) || isNaN(point.lat)) return;
        g.select('.points-container').append('svg:circle')
            .attr('r', 0.01)
            .attr('class', 'point')
            .attr('transform', `translate(${projection([point.long, point.lat])})scale(${scale})`)
    });
}