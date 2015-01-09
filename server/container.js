
var Tile = function(value){
    this.value = value;
}

var Container = function (rows, cols){
    
    this.players = [];
    this.grid = [[],[]];
    
    for (r=0;r<rows;r++){
        this.grid[r] = [];
        for (c=0;c<cols;c++){
            this.grid[r][c] = new Tile('empty');
        }
    }
    
    this.isPlayer = function(socket){
        if (this.players[socket.id])
            return true;
        return false;
    }

}

module.exports.make = Container;
