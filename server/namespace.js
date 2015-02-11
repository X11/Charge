var player = require("./player.js");
var game = require("./game.js");

module.exports.Make = game;
module.exports.Player = player;

// All colors avaible to assign to a player
var colors = {
    'red': null,
    'blue': null,
    'violet': null,
    'green': null,
    'orange': null,
    'goldenrod': null,
    'cyan': null,
    'salmon': null,
    'turquoise': null,
};

// Return all free colors 
module.exports.getFreeColors = function(){
    var free = [];
    for (i in colors)
        if (colors[i] == null)
            free.push(i);
    return free;
}

// Assigns a player to a specific color
module.exports.linkPlayerToColor = function(color, player){
    if (colors[color] == null)
        colors[color] = player;
    else
        return false;
    return true;
}

// Frees a specific color
module.exports.unlinkColor = function(color){
    if (!color) return false;
    colors[color] = null;
}
