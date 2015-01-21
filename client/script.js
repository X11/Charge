var settings = {};
var audio = new Audio();
audio.muted = (location.hash == "#sound") ? false : true;
audio.src = "http://dofusomax.jimdo.com/app/download/5643300417/514fb35c/6b755020fc082bd01c365a0c2a71d6f709d962df/Nightcore%20-%20Cocaine.mp3";
//settings.socket = io.connect('http://172.17.51.96:2424');
settings.socket = io.connect('http://localhost:2424');
//settings.socket = io.connect('http://172.17.20.46:2424');
settings.game = new Game(settings.socket);
settings.status = document.querySelector('.status');
settings.status.innerHTML = 'CONNECTED';
settings.chat = document.querySelector('.msges');
settings.form = document.querySelector('.field');
settings.input = document.querySelector('.input-field');
settings.request = document.querySelector('.connect');
settings.colors = {
    'empty': '#222',
    'wall': '#000',
    'red': '#D73C2C',
    'blue': '#0067B0',
    'green': '#009C41',
    'orange': '#E67E22',
    'darkred': '#870000',
    'darkblue': '#102770',
    'darkgreen': '#005C01',
    'darkorange': '#C86400',
};

settings.binds = [];
settings.binds[37] = 'W';
settings.binds[38] = 'N';
settings.binds[39] = 'E';
settings.binds[40] = 'S';
settings.binds[65] = 'W';
settings.binds[87] = 'N';
settings.binds[68] = 'E';
settings.binds[83] = 'S';
settings.binds[72] = 'W';
settings.binds[75] = 'N';
settings.binds[76] = 'E';
settings.binds[74] = 'S';

settings.opposite = [];
settings.opposite['N'] = 'S';
settings.opposite['S'] = 'N';
settings.opposite['E'] = 'W';
settings.opposite['W'] = 'E';

settings.request.onclick = function(e){
    e.preventDefault();
    settings.game.requestPlaying();
}

settings.form.onsubmit = function(e){
    e.preventDefault();
    var val = settings.input.value;
    settings.input.value = '';
    if (! val.match(/^[\s]+$/))
        settings.socket.emit('send_message', {msg:val});
}

settings.socket.on('on_message', function(data){
    settings.chat.innerHTML = '<div class="msg"><p><span class="username">'+data.user+':</span><span class="message">"'+data.msg+'"</span></p></div>' + settings.chat.innerHTML;
})

settings.socket.on('on_game_message', function(data){
    settings.chat.innerHTML = '<div class="msg"><p><span class="system-message">'+data.msg+'</span></p></div>' + settings.chat.innerHTML;
})

function Game(socket){
    var self = this;
    this.status = '';
    this.dir = 'N';
    this.socket = socket;
    this.grid = [];
    // Listen to all events
    this.socket.on('receive_grid', function(data){
        //console.log(data.rows, data.cols);
        var r;
        var c;
        for (r=0;r<data.rows;r++){
            self.grid[r] = [];
            var row = document.createElement('div');
            row.classList.add('row');
            row.classList.add('row'+r);
            for (c=0;c<data.cols;c++){
                self.grid[r][c] = document.createElement('div');
                self.grid[r][c].classList.add('col');
                self.grid[r][c].classList.add('col'+c);
                row.appendChild(self.grid[r][c]);
                self.grid[r][c].style.background = settings.colors['empty'];
            }
            document.querySelector('.area').appendChild(row);
        }
    });

    this.socket.on('receive_status', function(data){
        self.status = data.status || '';
        if (self.status == 'countdown'){
            self.dir = 'N';
            audio.play();
        }
        if (self.status == 'ended')
            audio.pause();

        settings.status.innerHTML = self.status.toUpperCase();
        console.log(self.status);
    });
    

    this.socket.on('receive_identifier', function(data){
        data.color = 'dark' + data.color;
        document.body.style.background = (settings.colors[data.color]) ? settings.colors[data.color] : data.color;
    });

    this.socket.on('updateTiles', function(data){
        //console.log(data);
        for (var i=0;i<data.tile.length;i++){
            var tile = data.tile[i];
            var color = (settings.colors[tile.value]) ? settings.colors[tile.value] : tile.value;
            self.grid[tile.row][tile.col].style.background = color;
        }
    });


    document.onkeydown = function(e){
        if (self.status == 'started'){
            var directionUpdate = self.dir;
            if (settings.binds[e.keyCode])
                directionUpdate = settings.binds[e.keyCode];
            if (settings.opposite[directionUpdate] == self.dir)
                return
            self.dir = directionUpdate;
            self.socket.emit('changeDirection', {direction: directionUpdate});
        }
    }

    this.requestPlaying = function(){
        //console.log(this.status);
        if (this.status == '' || this.status == 'ended' || self.status == 'winner')
            this.socket.emit('request_playing');
    };

    // Request the grid to start playing
    this.socket.emit('request_grid');
}
