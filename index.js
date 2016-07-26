'use strict';

var PokemonGO = require('pokemon-go-node-api');
var pokeBotConfig = require('./config.pokemonBot.js');
var PokemonRadar = require('./PokemonRadar');

var pokemonGoBot = new PokemonGO.Pokeio();
var pokemonRadar = new PokemonRadar();

pokemonGoBot.init(pokeBotConfig.username, pokeBotConfig.password, pokeBotConfig.location, pokeBotConfig.provider, function(err) {
    if (err) throw err;

    console.log('1[i] Current location: ' + pokemonGoBot.playerInfo.locationName);
    console.log('1[i] lat/long/alt: : ' + pokemonGoBot.playerInfo.latitude + ' ' + pokemonGoBot.playerInfo.longitude + ' ' + pokemonGoBot.playerInfo.altitude);

    pokemonGoBot.GetProfile(function(err, profile) {
        if (err) throw err;

        var poke = profile.currency[0].amount || 0;

        console.log('1[i] Username: ' + profile.username);
        console.log('1[i] Poke Storage: ' + profile.poke_storage);
        console.log('1[i] Item Storage: ' + profile.item_storage);
        console.log('1[i] Pokecoin: ' + poke);
        console.log('1[i] Stardust: ' + profile.currency[1].amount);

        pokemonRadar.on('searchComplete', function(){
            // farm pokestops
            console.log('searchComplete event');
        });

        pokemonRadar.on('pokemon', function(){
            console.log('pokemonEvent event');
        });
    });
});

