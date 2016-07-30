'use strict';

var PokeAPI = require('pokemongo-api').default;
var config = require('./config.pokemonBot.js');
var pokemonRadar = require('./PokemonRadar');

var Poke = new PokeAPI();

async function init() {
    Poke.player.location = {
        latitude: 49.9606927,
        longitude: 9.1541567
    };
    await Poke.login(config.username, config.password, config.provider);

    var player = await Poke.GetPlayer();
    var inventory = await Poke.GetInventory();

    //console.log(player, inventory);
    //console.log('1[i] Username: ' + player.username);
    //console.log('1[i] Poke Storage: ' + player.currencies[0]);
    //console.log('1[i] Item Storage: ' + inventory.GetInventoryResponse.inventory_delta.inventory_items);
    //console.log('1[i] Pokecoin: ' + player.currencies[0].amount);
    //console.log('1[i] Stardust: ' + player.currencies[1].amount);

    pokemonRadar.on('searchComplete', function () {
        // farm pokestops
        console.log('searchComplete event');
    });

    pokemonRadar.on('pokemon', function () {
        console.log('pokemonEvent event');
    })
}

init().catch(console.log);