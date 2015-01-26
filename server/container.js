
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

// Nothing more then a small container with its value
var Tile = function(value){
    this.value = value;
}

// The game object himself
var Game = function (rows, cols){
    var self = this;   
    this.rows = rows;
    this.cols = cols;
    // All queued players
    this.players = [];
    // The grid or playing field
    this.grid = [[],[]];
    // Spawnpoints MUST be assigned
    this.spawnpoints = [];
    // All events to handle
    this.triggers = {
        'onPlayerDead': function(){},
        'onGameStart': function(){},
        'onGameEnd': function(){},
    };
    this.playing = false;
    
    // Init the grid with the given size
    for (r=0;r<rows;r++){
        this.grid[r] = [];
        for (c=0;c<cols;c++)
            this.grid[r][c] = new Tile('empty');
        
    }
    
    // Check weather the socket.id is a player
    this.isPlayer = function(id){
        for (i in this.players)
            if (this.players[i].socket.id == id)
                return true;
        return false;
    }

    // Removes a player with a socket id
    this.removePlayer = function(id){
        var index = null;
        for (i in this.players)
            if (this.players[i].socket.id == id)
                index = i;
        if (index)
            return this.players.splice(i, 1);
        return false;
    }

    // Method to start a round of the game
    // Will reset eveything
    // and send a notice to the player that the round is starting
    this.start = function(){
        var i;
        var l = this.players.length;
        this.playing = true;
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

        // The spawnpoints to spawn the players
        for (i=0;i<l;i++){
            var cur = this.players[i];
            cur.put = 0;
            cur.x = this.spawnpoints[i][0];
            cur.y = this.spawnpoints[i][1];
            cur.dir = this.spawnpoints[i][2];
            cur.alive = true;
            //cur.color = colors[i];
            this.grid[cur.x][cur.y].value = cur.socket.id;
            needUpdate.tile.push({
                row : cur.x,
                col : cur.y,
                value : cur.color,
            });
        }

        // Send it to all players who are in queue
        for (i in this.players){
            this.players[i].socket.emit('receive_status', {status: 'countdown'});
            this.players[i].socket.emit('updateTiles', needUpdate);
        }

        // Handle the countdown
        setTimeout(function(){
            self.triggers['onGameStart']();           
            for (i in self.players){
                self.players[i].socket.emit('receive_status', {status: 'started'});
            }
        }, 5000);
    }

    // This renders the play field
    this.move = function(){
        // All tiles which will change value
        var needUpdate = {tile:[]};
        // Loop thru all players to get there new tile
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
            // Check for collision,
            var reason = this.checkCollision(newPos)
            if (reason != false){
                // Player will die
                cur.alive = false;
                // Send a status to the player that he no longer plays
                cur.socket.emit('receive_status', {status: 'dead'});
                if (reason.match(/^dark/))
                    reason = reason.replace(/^dark/, '');
                this.triggers['onPlayerDead'](cur, reason);
                continue;
            }
            cur.put++;
            // GAPS :D
            if (cur.put%40 < 10)
                currentTile.value = 'empty';
            else
                currentTile.value = 'dark'+cur.color;
            // old tile gets a darker color
            needUpdate.tile.push({
                row:    cur.x,
                col:    cur.y,
                value:  currentTile.value,
            });
            cur.x = newPos[0];
            cur.y = newPos[1];
            this.grid[cur.x][cur.y].value = cur.color;
            // new tile gets the players color
            needUpdate.tile.push({
                row:    cur.x,
                col:    cur.y,
                value:  cur.color,
            });
        }
        // Send the updated titles to all players
        for (i in this.players)
            this.players[i].socket.emit('updateTiles', needUpdate);
        this.checkGame();
    }
    
    // Method to check for collision
    // Returns false or the value of the tile
    this.checkCollision = function(pos){
        if(this.grid[pos[0]][pos[1]].value == 'empty')
            return false;
        return this.grid[pos[0]][pos[1]].value;
    }
    
    // Function to check weather the game ended due to conditions
    this.checkGame = function(){
        // check playeras
        var alive = [];
        for (i in this.players)
            if (this.players[i].alive)
                alive.push(1);
        
        // Is there are less then 2 players
        if (alive.length < 2){
            this.playing = false;
            var winner = 'draw';
            for (i in this.players){
                // if the player is alive he is obviously the winner Give him some credit :-)
                if (this.players[i].alive){
                    this.players[i].socket.emit('receive_status', {status: 'winner'});
                    winner = this.players[i];
                } else
                    this.players[i].socket.emit('receive_status', {status: 'ended'});
            }
            this.triggers['onGameEnd'](winner);
        }
    }
    
    // Method to display updating grid to console (Used for testing purposes)
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

    // Assign callbacks
    this.on = function(on, callback){
        this.triggers[on] = callback.bind(this);
    }

}

opposite = [];
opposite['N'] = 'S';
opposite['S'] = 'N';
opposite['E'] = 'W';
opposite['W'] = 'E';

// Player object storing values and handling direction changes
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
        if (opposite[data.direction] == self.dir)
            return
        self.dir = data.direction;
    });
}

// Export the modules
module.exports.Make = Game;
module.exports.Player = Player;
