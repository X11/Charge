
var Tile = function(value){
    this.value = value;
}

var Game = function (rows, cols){
    
    this.rows = rows;
    this.cols = cols;
    this.players = [];
    this.grid = [[],[]];
    
    for (r=0;r<rows;r++){
        this.grid[r] = [];
        for (c=0;c<cols;c++){
            if (r == 0 || r == rows-1 || c == 0 || c == cols-1)
                this.grid[r][c] = new Tile('wall');
            else
                this.grid[r][c] = new Tile('empty');
        }
    }
    
    this.isPlayer = function(id){
        for (i in this.players)
            if (this.players[i].socket.id == id)
                return true;
        return false;
    }

    this.start = function(){
        var i;
        var l = this.players.length;
        for (i=0;i<l;i++){
            var cur = this.players[i];
            if (l == 3 && i == 0){
                cur.x = Math.floor(this.rows/2);
                cur.y = Math.floor(this.rows/3);
                this.dir = 'S';
            } else {
                var add = 1;
                if (l==3)
                    add = 0;
                cur.x = Math.floor(this.rows/3*2);
                cur.y = Math.floor(this.rows/3*(i+add));
            }
            this.grid[cur.x][cur.y].value = cur.socket.id;
        }
    }

    this.move = function(){
        for (i in this.players){
            var cur = this.players[i];
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
                continue;
            }
            //console.log(cur.socket.id, ' moving ', newPos);
            currentTile.value = 'wall';
            cur.x = newPos[0];
            cur.y = newPos[1];
            this.grid[cur.x][cur.y].value = cur.socket.id;
        }
    }

    this.checkCollision = function(pos){
        if(this.grid[pos[0]][pos[1]].value == 'empty')
            return false;
        return true;
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
                    default:
                        p+= '0';
                }
            }
            console.log(p);
        }
    }

}

function Player(options){
    this.x = 0;
    this.y = 0;
    this.dir = 'N';
    this.socket = options.socket;
}

module.exports.Make = Game;
module.exports.Player = Player;
