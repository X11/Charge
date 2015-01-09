var vals = {'empty': 0, 'wall': 1, 'player': 2, 'trail': 3}

function Container() 
{
    this.tiles = [[], []]

    this.container = document.querySelector('.container');

    for (var r = 0; r < 40; r++) 
    {
        this.tiles[r] = []
        for (var c = 0; c < 40; c++) 
        {
            this.tiles[r][c] = new Tile(r, c)
            this.container.appendChild(this.tiles[r][c].div);
        }
    }
}

function Tile(x, y){
    this.div = document.createElement('div');
    this.div.className = 'container-child';

    this.x = x;
    this.y = y;
    this.val = 0;
    this.setValue = function() {}
    this.checkUpdate = function() {}
}

var Screen = new Container()
