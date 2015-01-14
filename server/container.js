
var colors = [
    'red',
    'blue',
    'green',
    'orange',
]

var Tile = function(value){
    this.value = value;
}

var Game = function (rows, cols){
    var self = this;   
    this.rows = rows;
    this.cols = cols;
    this.players = [];
    this.grid = [[],[]];
    this.spawnpoints = [];
    this.triggers = {
        'onPlayerDead': function(){},
        'onGameStart': function(){},
        'onGameEnd': function(){},
    };
    this.playing = false;
    
    for (r=0;r<rows;r++){
        this.grid[r] = [];
        for (c=0;c<cols;c++){
            this.grid[r][c] = new Tile('empty');
        }
    }
    
    this.isPlayer = function(id){
        for (i in this.players)
            if (this.players[i].socket.id == id)
                return true;
        return false;
    }

    this.removePlayer = function(id){
        var index = null;
        for (i in this.players)
            if (this.players[i].socket.id == id)
                index = i;
        if (index)
            return this.players.splice(i, 1);
        return false;
    }

    this.start = function(){
        var i;
        var l = this.players.length;
        var needUpdate = {tile:[]};
        
        for (r=0;r<this.rows;r++){
            for (c=0;c<this.cols;c++){
                var old = this.grid[r][c].value;
                if (r == 0 || r == this.rows-1 || c == 0 || c == this.cols-1)
                    this.grid[r][c].value = 'wall';
                else
                    this.grid[r][c].value = 'empty';
                needUpdate.tile.push({
                    row : r,
                    col : c,
                    value : this.grid[r][c].value 
                });
            }
        }

        for (i=0;i<l;i++){
            var cur = this.players[i];
            cur.put = 0;
            cur.x = this.spawnpoints[i][0];
            cur.y = this.spawnpoints[i][1];
            cur.dir = this.spawnpoints[i][2];
            cur.alive = true;
            cur.color = colors[i];
            this.grid[cur.x][cur.y].value = cur.socket.id;
            needUpdate.tile.push({
                row : cur.x,
                col : cur.y,
                value : cur.color,
            });
        }

        this.playing = true;
        for (i in this.players){
            this.players[i].socket.emit('receive_identifier', {color: this.players[i].color});
            this.players[i].socket.emit('receive_status', {status: 'countdown'});
            this.players[i].socket.emit('updateTiles', needUpdate);
        }

        setTimeout(function(){
            self.triggers['onGameStart']();           
            for (i in self.players){
                self.players[i].socket.emit('receive_status', {status: 'started'});
            }
        }, 3000);
    }

    this.move = function(){
        var needUpdate = {tile:[]};
        for (i in this.players){
            var cur = this.players[i];
            if (cur.alive == false) continue;

            var newPos = [cur.x, cur.y];
            var currentTile = this.grid[cur.x][cur.y];
            switch(cur.dir){
                case 'N':
                    newPos[0]-=1;
                    break;
                case 'E':
                    newPos[1]+=1;
                    break;
                case 'S':
                    newPos[0]+=1;
                    break;
                case 'W':
                    newPos[1]-=1;
                    break;
            }
            if (this.checkCollision(newPos)){
                // Player will die
                cur.alive = false;
                cur.socket.emit('receive_status', {status: 'dead'});
                this.triggers['onPlayerDead'](cur);
                continue;
            }
            cur.put++;
            console.log(cur.socket.id, ' moving ', newPos);
            //currentTile.value = 'wall';
            if (cur.put%30 < 2)
                currentTile.value = 'empty';
            else
                currentTile.value = 'dark'+cur.color;
            needUpdate.tile.push({
                row:    cur.x,
                col:    cur.y,
                value:  currentTile.value,
            });
            cur.x = newPos[0];
            cur.y = newPos[1];
            this.grid[cur.x][cur.y].value = cur.color;
            needUpdate.tile.push({
                row:    cur.x,
                col:    cur.y,
                value:  cur.color,
            });
        }
        for (i in this.players){
            this.players[i].socket.emit('updateTiles', needUpdate);
        }
        this.checkGame();
    }

    this.checkCollision = function(pos){
        if(this.grid[pos[0]][pos[1]].value == 'empty')
            return false;
        return true;
    }

    this.checkGame = function(){
        // check playeras
        var alive = [];
        for (i in this.players)
            if (this.players[i].alive)
                alive.push(1);

        if (alive.length <= 1){
            this.playing = false;
            for (i in this.players){
                this.players[i].socket.emit('receive_status', {status: 'ended'});
            }
            this.triggers['onGameEnd']();
        }
    }

    this.print = function(){
        for (var r = 0; r < this.grid.length; r++){
            var p = '';
            for (var c = 0; c < this.grid[r].length; c++){
                switch(this.grid[r][c].value){
                    case 'empty':
                        p += ' ';
                        break;
                    case 'wall':
                        p += 'X';
                        break;
                    case 'red':
                        p += '\033[44m0\033[0m';
                        break;
                    case 'blue':
                        p += '\033[43m0\033[0m';
                        break;
                    case 'green':
                        p += '\033[42m0\033[0m';
                        break;
                    default:
                        p+= '0';
                }
            }
            console.log(p);
        }
    }

    this.on = function(on, callback){
        this.triggers[on] = callback.bind(this);
    }

}

function Player(options){
    var self = this;
    this.x = 0;
    this.y = 0;
    this.put = 0;
    this.color = '';
    this.dir = 'N';
    this.alive = false;
    this.socket = options.socket;

    this.socket.on('changeDirection', function(data){
        self.dir = data.direction;
    });
}

module.exports.Make = Game;
module.exports.Player = Player;
