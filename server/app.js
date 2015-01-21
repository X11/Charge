
var io = require('socket.io').listen(2424);
io.set('origins', '*:*');

var Container = require('./container.js');
var game = new Container.Make(70, 70);
game.spawnpoints = [
    [10, 10, 'S'],
    [60, 60, 'N'],
    [10, 60, 'S'],
    [60, 10, 'N'],

    [30, 30, 'N'],
    [40, 40, 'S'],
    [30, 40, 'N'],
    [40, 30, 'S'],
];
var players = [];


function convertHtmlToText(returnText) {
    returnText = returnText.replace(/(<([^>]+)>)/ig,"");
    //-- return
    return returnText;
}

io.sockets.on('connection', function(socket){
    
    console.log(socket.id);   

    socket.on('request_grid', function(){
        console.log(this.id + ' requesting grid layout');
        this.emit('receive_grid', {
            rows: game.grid.length,
            cols: game.grid[0].length
        });
        var free = Container.getFreeColors();
        if (free.length > 0){
            players[this.id] = new Container.Player({socket:this});
            players[this.id].color = free[0];
            Container.linkPlayerToColor(free[0], players[this.id]);
            this.emit('receive_identifier', {color: players[this.id].color});
        } else {
            this.emit('receive_status', {status: 'To many connected players'});
        }
    });

    socket.on('request_playing', function(){
        if (game.players.length >= 8) {
            console.log(this.id + ' denied from game queue');
            this.emit('receive_status', {status: 'To many players'});
            return;
        }
        if (this.playing) {
            console.log(this.id + ' denied from game queue');
            this.emit('receive_status', {status: 'Game already started'});
            return;
        }
        if (!players[this.id].color){
            return;
        };
        console.log(this.id + ' inserted into game queue');
        game.players.push(players[this.id]);
        this.emit('receive_status', {status: 'queue'});
    });
    
    socket.on('disconnect', function(){
        if (game.isPlayer(this.id)){
            game.removePlayer(this.id);
            console.log(this.id + ' disconnected, Removed from queue');
            game.checkGame();
        }
        if (players[this.id])
            Container.unlinkColor(players[this.id].color);
        delete players[this.id];
    });
    
    socket.on('send_message', function (data) {
        var user = players[this.id].color;
        var msg = convertHtmlToText(data.msg);
        for (i in players)
            players[i].socket.emit('on_message', {user: user, msg: msg});
        console.log(user, data.msg);
    });
});

var refresh_rate = 60;
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

game.on('onPlayerDead', function(player, killreason){
    for (i in players)
        players[i].socket.emit('on_game_message', {msg: player.color + ' died by ' + killreason});
});

game.on('onGameStart', function(){
    refresh_timer = setInterval(function(){
        game.move();
        //game.print();
    }, refresh_rate);
});

game.on('onGameEnd', function(winner){
    clearInterval(refresh_timer);
    var message = (winner == 'draw') ? 'Game ended in a draw' : winner.color + ' has won the game!';
    for (i in players)
        players[i].socket.emit('on_game_message', {msg: message});
    game.players = [];
    lobbyStart();
});

lobbyStart();


