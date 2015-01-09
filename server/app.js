
var io = require('socket.io').listen(2424);
var container = require('./container.js');
var game = new container.make(40, 40);

io.sockets.on('connection', function(socket){
    var l = game.grid.length;
    console.log(l, game.grid[0].length);
});
