
var io = require('socket.io').listen(2424);
var Container = require('./container.js');
var game = new Container.Make(40, 40);

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
            game.players.push(new Container.Player({socket:this}));
            this.emit('receive_status', {status: 'waiting'});
        } else {
            console.log(this.id + ' denied from game queue');
            this.emit('notice', {message: 'To many players'});
        }
    });
    
    socket.on('disconnect', function(){
        if (game.isPlayer(this.id)){    
            console.log(this.id + ' disconnected, Removed from waiting queue');
        }
    });

});

var refresh_rate = 60;
var refresh_timer = null;
var checkForStart = setInterval(function(){
    if (game.players.length > 1){
        clearInterval(checkForStart);
        game.start();
        refresh_timer = setInterval(function(){
            game.move();
            game.print();
        }, refresh_rate);
    }
}, 3000);
