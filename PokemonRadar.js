'use strict';

var EventEmitter = require('events');
var PokeAPI = require('pokemongo-api').default;
var config = require('./config.pokemonRadar');

var Poke = new PokeAPI();
var generateLocationSteps = require('./generateLocationSteps');

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
    var locations = generateLocationSteps([49.9606927, 9.1541567], 2);
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
        Poke.player.playerInfo.latitude = parseFloat(location[0]);
        Poke.player.playerInfo.longitude = parseFloat(location[1]);
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
