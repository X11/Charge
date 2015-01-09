
var io = require('socket.io').listen(2424);
var container = require('./container.js');
var game = new container.make(40, 40);

io.sockets.on('connection', function(socket){
    
    console.log('Socket connected');

    socket.on('request_grid', function(){
        console.log(this.id + ' requesting grid layout');
        this.emit('receive_grid', {
            rows: game.grid.length,
            cols: game.grid[0].length
        });
    });

    socket.on('request_playing', function(){
        if (game.players.length < 3) {
            console.log(this.id + ' inserted into game queue');
            game.players.push(this);
            this.emit('receive_status', {status: 'waiting'});
        } else {
            console.log(this.id + ' denied from game queue');
            this.emit('notice', {message: 'To many players'});
        }
    });
    
    socket.on('disconnect', function(){
        if (game.players.indexOf(this) != -1){
            console.log(this.id + ' disconnected, Removed from waiting queue');
        }
    });

});
