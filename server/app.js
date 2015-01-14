
var io = require('socket.io').listen(2424);
io.set('origins', '*:*');

var Container = require('./container.js');
var game = new Container.Make(50, 50);
game.spawnpoints = [
    [10, 10, 'S'],
    [40, 40, 'N'],
    [10, 40, 'S'],
    [40, 10, 'N'],
];

io.sockets.on('connection', function(socket){
    console.log(socket.id);   

    socket.on('request_grid', function(){
        console.log(this.id + ' requesting grid layout');
        this.emit('receive_grid', {
            rows: game.grid.length,
            cols: game.grid[0].length
        });
    });

    socket.on('request_playing', function(){
        if (game.players.length < 4) {
            console.log(this.id + ' inserted into game queue');
            var player = new Container.Player({socket:this});
            game.players.push(player);
            this.emit('receive_status', {status: 'waiting'});
        } else {
            console.log(this.id + ' denied from game queue');
            this.emit('receive_status', {status: 'To many players'});
        }
    });
    
    socket.on('disconnect', function(){
        if (game.isPlayer(this.id)){
            game.removePlayer(this.id);
            console.log(this.id + ' disconnected, Removed from queue');
        }
    });

});

var refresh_rate = 50;
var refresh_timer = null;
var checkForStart = null;
function lobbyStart(){
    checkForStart = setInterval(function(){
        if (game.players.length > 1){
            clearInterval(checkForStart);
            game.start();
        }
    }, 5000);
}

game.on('onPlayerDead', function(player){
    console.log(player.color, 'dead');
    //console.log(this.players);
});

game.on('onGameStart', function(){
    refresh_timer = setInterval(function(){
        game.move();
        //game.print();
    }, refresh_rate);
});

game.on('onGameEnd', function(){
    clearInterval(refresh_timer);
    console.log('Game ending');
    game.players = [];
    lobbyStart();
});

lobbyStart();


