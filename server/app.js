
var io = require('socket.io').listen(2424);
io.set('origins', '*:*');

var Container = require('./container.js');
var game = new Container.Make(70, 70);
game.spawnpoints = [
    [10, 10, 'S'],
    [40, 40, 'N'],
    [10, 40, 'S'],
    [40, 10, 'N'],
];
var players = [];


function convertHtmlToText(returnText) {
    //-- remove BR tags and replace them with line break
    returnText=returnText.replace(/<br>/gi, "\n");
    returnText=returnText.replace(/<br\s\/>/gi, "\n");
    returnText=returnText.replace(/<br\/>/gi, "\n");

    //-- remove P and A tags but preserve what's inside of them
    returnText=returnText.replace(/<p.*>/gi, "\n");
    returnText=returnText.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1)");
    returnText=returnText.replace(/<h.*>(.*?)<\/a>/gi, " $2 ($1)");

    //-- remove all inside SCRIPT and STYLE tags
    returnText=returnText.replace(/<script.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/script>/gi, "");
    returnText=returnText.replace(/<style.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, "");
    //-- remove all else
    returnText=returnText.replace(/<(?:.|\s)*?>/g, "");

    //-- get rid of more than 2 multiple line breaks:
    returnText=returnText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n");

    //-- get rid of more than 2 spaces:
    returnText = returnText.replace(/ +(?= )/g,'');

    //-- get rid of html-encoded characters:
    returnText=returnText.replace(/&nbsp;/gi," ");
    returnText=returnText.replace(/&amp;/gi,"&");
    returnText=returnText.replace(/&quot;/gi,'"');
    returnText=returnText.replace(/&lt;/gi,'<');
    returnText=returnText.replace(/&gt;/gi,'>');

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
        if (game.players.length < 4) {
            console.log(this.id + ' inserted into game queue');
            game.players.push(players[this.id]);
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
            game.checkGame();
        }
        if (players[this.id])
            Container.unlinkColor(players[this.id].color);
        delete players[this.id];
    });
    
    socket.on('send_message', function (data) {
        var user = players[this.id].color;
        data,msg = convertHtmlToText(data.msg);
        for (i in players)
            players[i].socket.emit('on_message', {user: user, msg: data.msg});
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
    var message = (winner == 'draw') ? 'Game ended in a draw' : winner.color + ' have won the game!';
    for (i in players)
        players[i].socket.emit('on_game_message', {msg: message});
    game.players = [];
    lobbyStart();
});

lobbyStart();


