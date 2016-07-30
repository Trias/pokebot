'use strict';

var EventEmitter = require('events');
var range = require('lodash').range;
var PokeAPI = require('pokemongo-api').default;
var async = require('async');
var config = require('./config.pokemonRadar');

var Poke = new PokeAPI();

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

var pokeRadar = new EventEmitter();

var pokeStops = {};
var gyms = {};


async function init() {
    Poke.player.location = {
        latitude: 49.9606927,
        longitude: 9.1541567
    };

    await login();
    await Poke.GetPlayer();
    var locations = generate_location_steps([49.9606927, 9.1541567], 2);
    console.log(locations);
    await search(locations);
}


async function login() {
    await Poke.login(config.username, config.password, config.provider);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function search(locations) {
    console.log('search');

    async function pling (location) {
        console.log('pling');
        Poke.player.playerInfo.location = {
            latitude: parseFloat(location[0]),
            longitude: parseFloat(location[1])
        };
        var objects = await Poke.GetMapObjects();

        for (let pokemon of objects.catchable_pokemons) {
            pokeRadar.emit('pokemon', pokemon);
        }

        for (let gym of objects.forts.gyms) {
            gyms[gym.id] = gym;
        }

        for (let checkPoint of objects.forts.checkpoints) {
            pokeStops[checkPoint.id] = checkPoint;
        }
    }

    async function plingpling(i) {
        console.log('plingpling', i);
        await wait(1000);
        try {
            await pling(locations[i]);
        } catch (e) {
            console.log(e);
            await wait(2000);
            plingpling(i);
            return;
        }
        if (locations[i + 1]) {
            plingpling(i + 1);
        } else {
            searchComplete();
        }
    }

    plingpling(0);

    function searchComplete() {
        pokeRadar.emit('searchComplete');
        //that.checkLogin(that.search.bind(that, locations))
    }
}

init().catch(console.log);

module.exports = pokeRadar;
