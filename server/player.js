
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
module.exports = Player;
