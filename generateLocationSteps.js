var range = require('lodash').range;

var lat_gap_meters = 150;
var lng_gap_meters = 86.6;
var meters_per_degree = 111111;
var lat_gap_degrees = lat_gap_meters / meters_per_degree;

function calculate_lng_degrees(lat) {
    return lng_gap_meters / (meters_per_degree * Math.cos(lat / (180 / Math.PI)));
}

var move = {
    right: (location) => [location[0], location[1] + calculate_lng_degrees(location[0]) * 2],
    rightDown: (location) => [location[0] - lat_gap_degrees, location[1] + calculate_lng_degrees(location[0])],
    leftDown: (location) => [location[0] - lat_gap_degrees, location[1] - calculate_lng_degrees(location[0]) * 2],
    left: (location) => [location[0], location[1] - calculate_lng_degrees(location[0]) * 2],
    leftUp: (location) => [location[0] + lat_gap_degrees, location[1] - calculate_lng_degrees(location[0])],
    rightUp: (location) => [location[0] + lat_gap_degrees, location[1] + calculate_lng_degrees(location[0])],
};

function generate_location_steps(initial_location, num_steps) {
    var location;
    var ring = 1;
    var locationSteps = [];
    locationSteps.push(initial_location);

    while (ring < num_steps) {
        //Move the location diagonally to top left spot, then start the circle which will end up back here for the next ring
        // Move Lat north first
        location = initial_location;

        range(ring).forEach(function () {
            location = move.leftUp(location);
        });
        locationSteps.push(location);

        range(ring).forEach(function () {
            location = move.right(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function () {
            location = move.rightDown(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function () {
            location = move.leftDown(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function () {
            location = move.left(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function () {
            location = move.leftUp(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function () {
            location = move.rightUp(location);
            locationSteps.push(location);
        });

        ring += 1;
    }
    return locationSteps;
}

module.exports = generate_location_steps;