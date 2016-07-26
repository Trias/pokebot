'use strict';

var EventEmitter = require('events');
var range = require('lodash').range;
var PokemonGO = require('pokemon-go-node-api');
var async = require('async');
var config = require('./config.pokemonRadar');

var lat_gap_meters = 150;
var lng_gap_meters = 86.6;
var meters_per_degree = 111111;
var lat_gap_degrees = lat_gap_meters / meters_per_degree;

function calculate_lng_degrees(lat) {
    return lng_gap_meters / (meters_per_degree * Math.cos(lat/(180/Math.PI)));
}

var move = {
    right: (location) => [location[0], location[1]+calculate_lng_degrees(location[0]) * 2],
    rightDown: (location) => [location[0]-lat_gap_degrees, location[1]+calculate_lng_degrees(location[0])],
    leftDown: (location) => [location[0]-lat_gap_degrees, location[1]-calculate_lng_degrees(location[0]) * 2],
    left: (location) => [location[0], location[1]-calculate_lng_degrees(location[0]) * 2],
    leftUp: (location) => [location[0]+lat_gap_degrees , location[1]-calculate_lng_degrees(location[0])],
    rightUp: (location) => [location[0]+lat_gap_degrees, location[1]+calculate_lng_degrees(location[0])],
};

function generate_location_steps(initial_location, num_steps) {
    var location;
    var ring = 1;
    var locationSteps = [];

    while (ring < num_steps) {
         //Move the location diagonally to top left spot, then start the circle which will end up back here for the next ring
         // Move Lat north first
        location = initial_location;

        range(ring).forEach(function(){
            location = move.leftUp(location);
        });
        locationSteps.push(location);

        range(ring).forEach(function(){
            location = move.right(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function(){
            location = move.rightDown(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function(){
            location = move.leftDown(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function(){
            location = move.left(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function(){
            location = move.leftUp(location);
            locationSteps.push(location);
        });
        range(ring).forEach(function(){
            location = move.rightUp(location);
            locationSteps.push(location);
        });

        ring += 1;
    }
    return locationSteps;
}

module.exports = class PokemonRadar extends EventEmitter {
    constructor(){
        super();
        this.pokeStops = {};
        this.gyms = {};
        this.pokemonRadar = new PokemonGO.Pokeio();
        var that = this;
        this.pokemonRadar.init(config.username, config.password, config.location, config.provider, function(err){
            if (err) throw err;
            console.log('[i] Current location: ' + that.pokemonRadar.playerInfo.locationName);
            console.log('[i] lat/long/alt: : ' + that.pokemonRadar.playerInfo.latitude + ' ' + that.pokemonRadar.playerInfo.longitude + ' ' + that.pokemonRadar.playerInfo.altitude);

            var locations = generate_location_steps([that.pokemonRadar.playerInfo.latitude, that.pokemonRadar.playerInfo.longitude], 10);

            console.log(locations);
            that.search(locations);
        });
    }

    search(locations){
        console.log('search');
        var that = this;
        async.forEachLimit(locations, 1, function(location, next){
            that.pokemonRadar.SetLocation({
                coords: {
                    latitude: location[0],
                    longitude: location[1]
                },
                type: 'coords'
            }, function(err, coords){
                if (err) console.log(err);

                console.log(coords.latitude+','+coords.longitude);

                that.pokemonRadar.Heartbeat(function(err, hb) {
                    if (err) {
                        console.error(err);
                        next();
                    }
                    hb.cells.forEach((cell) => {
                        cell.MapPokemon.forEach(function(mapPokemon) {
                            console.log(mapPokemon);

                            var pokemon = that.pokemonRadar.pokemonlist[parseInt(mapPokemon.PokedexNumber) - 1];
                            that.emit('pokemon', mapPokemon);

                            console.log('[+] There is a ' + pokemon.name + ' at ' + mapPokemon.Latitude + ' ' + mapPokemon.Longitude);
                        });
                        cell.Fort.forEach(function(fort){
                            if(null === fort.FortType || 0 === fort.FortType){
                                that.gyms[fort.FortId] = fort;
                            }else{
                                that.pokeStops[fort.FortId] = fort;
                            }
                        });
                    });
                    next();
                });
            });
        }, () => {
            that.emit('searchComplete');
            that.checkLogin(that.search.bind(that, locations))
        });
    }
    checkLogin(callback) {
        callback();
    }
};
