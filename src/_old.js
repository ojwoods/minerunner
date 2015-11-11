BasicGame.Game = function(game) {

    //	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    this.game; //	a reference to the currently running game
    this.add; //	used to add sprites, text, groups, etc
    this.camera; //	a reference to the game camera
    this.cache; //	the game cache
    this.input; //	the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
    this.load; //	for preloading assets
    this.math; //	lots of useful common math operations
    this.sound; //	the sound manager - add a sound, play one, set-up markers, etc
    this.stage; //	the game stage
    this.time; //	the clock
    this.tweens; //	the tween manager
    this.world; //	the game world
    this.particles; //	the particle manager
    this.physics; //	the physics manager
    this.rnd; //	the repeatable random number generator

    //	You can use any of these from any function within this State.
    //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

};

BasicGame.Game.prototype = {
    GRIDSIZE: 100,
    GRIDSIZE_STR: "100",
    GRID_HEIGHT: 10,
    GRID_WIDTH: 7,
    PLAYER_SCROLL_HEIGHT: 4,

    tilesprite: null,
    map: null,
    mapLayer1: null,
    cursors: null,
    player: null,
    screenMoving: null,
    proximityCount: 0,
    collision: false,


    create: function() {
        this.game.stage.backgroundColor = '#2d2d2d';
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // this.grid = this.game.add.tileSprite(0, 0, 700, 1000, 'grid');
        //  Creates a blank tilemap
        this.map = this.game.add.tilemap();

        //  Add a Tileset image to the map
        this.map.addTilesetImage('test','grid',100,100);

        //  Creates a new blank layer and sets the map dimensions.
        //  In this case the map is 40x30 tiles in size and the tiles are 32x32 pixels in size.
        this.mapLayer1 = this.map.create('mainMap', this.GRID_WIDTH, this.GRID_HEIGHT*2, 100, 100);
        this.map.fill(0, 0, 0, this.GRID_WIDTH, this.GRID_HEIGHT*2);

        //  Resize the world
       // this.mapLayer1.resizeWorld();

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.player = this.game.add.sprite(350, 1000 - 250, 'player');
        this.player.anchor.setTo(0.5, 0.5);
        this.game.physics.arcade.enable(this.player);

        this.minesGroup = this.game.add.group();

        this.updateGridPosition(this.player);
        this.screenMoving = false;

        var proximityStyle = {
            font: "50px Arial",
            fill: "#fff",
            align: "center"
        };
        this.proximityText = this.game.add.text(this.game.world.centerX, 20, "Proximity: " + this.proximityCount, proximityStyle);
        this.proximityText.anchor.set(0.5, 0);
    },



    update: function() {
        if (!this.screenMoving) {
            if (this.cursors.up.isDown) {
                if (this.player.gridPosition.y >= this.PLAYER_SCROLL_HEIGHT) { // Scroll up
                    this.createNewRow();
                    this.scrollRows();
                    this.game.add.tween(this.map).to({

                        y: this.GRIDSIZE_STR
                    }, 250, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {
                        this.updateGridPosition(this.player);
                        this.updateProximityCount();
                        this.screenMoving = false;
                    }, this);
                    this.screenMoving = true;
                } else // walk up
                {
                    this.game.add.tween(this.player).to({

                        y: "-" + this.GRIDSIZE_STR
                    }, 250, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {
                        this.updateGridPosition(this.player);
                        this.updateProximityCount();
                        this.screenMoving = false;
                    }, this);
                    this.screenMoving = true;
                }
            }
            if (this.cursors.down.isDown) {
                if (this.player.gridPosition.y <= this.PLAYER_SCROLL_HEIGHT && this.player.gridPosition.y > 1) {
                    this.game.add.tween(this.player).to({

                        y: this.GRIDSIZE_STR
                    }, 250, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {
                        this.updateGridPosition(this.player);
                        this.updateProximityCount();
                        this.screenMoving = false;
                    }, this);
                    this.screenMoving = true;
                }
            }
            if (this.cursors.left.isDown) {
                if (this.player.gridPosition.x > 1) {
                    this.game.add.tween(this.player).to({
                        x: "-" + this.GRIDSIZE_STR
                    }, 250, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {

                        this.updateGridPosition(this.player);
                        this.updateProximityCount();
                        this.screenMoving = false;
                    }, this);
                    this.screenMoving = true;
                }
            }
            if (this.cursors.right.isDown) {
                if (this.player.gridPosition.x < this.GRID_WIDTH) {
                    this.game.add.tween(this.player).to({
                        x: this.GRIDSIZE_STR
                    }, 250, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {

                        this.updateGridPosition(this.player);
                        this.updateProximityCount();
                        this.screenMoving = false;
                    }, this);
                    this.screenMoving = true;
                }
            }
        }
    },

    createNewRow: function() {
        // Add mines
        var mine = this.minesGroup.getFirstExists(false);
        if (!mine) {
            mine = new Mine(this.game, 100, -this.GRIDSIZE / 2);
            this.minesGroup.add(mine);
        } else {
            console.log("Recycle");
        }
        mine.gridPosition.x = this.game.rnd.integerInRange(1, this.GRID_WIDTH);
        mine.gridPosition.y = this.GRID_HEIGHT + 1;
        mine.revive();
        mine.visible = false;
        this.setWorldPositionFromGrid(mine);
    },
    scrollRows: function() {
        this.minesGroup.forEach(function(mine) {
            mine.game.add.tween(mine).to({
                y: "100"
            }, 250, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function(mine) {
                this.updateGridPosition(mine);
            }, this);
        }, this);

    },
    updateGridPosition: function(object) {
        if (!object.gridPosition) {
            object.gridPosition = {};
        }

        object.gridPosition.x = Phaser.Math.roundAwayFromZero(object.x / this.GRIDSIZE);
        object.gridPosition.y = this.GRID_HEIGHT - Phaser.Math.roundAwayFromZero(object.y / this.GRIDSIZE) + 1;
    },

    setWorldPositionFromGrid: function(object) {
        object.x = ((object.gridPosition.x - 1) * this.GRIDSIZE) + this.GRIDSIZE / 2;

        var reverseY = this.GRID_HEIGHT - object.gridPosition.y;
        object.y = ((reverseY) * this.GRIDSIZE) + this.GRIDSIZE / 2;
        console.dir(object)
    },

    updateProximityCount: function() {
        this.proximityCount = 0;
        this.collision = false;

        this.minesGroup.forEach(function(mine) {
            // Left middle
            if ((this.player.gridPosition.x - 1 == mine.gridPosition.x) && (this.player.gridPosition.y == mine.gridPosition.y)) {
                this.proximityCount++;
            }
            // right middle
            else if ((this.player.gridPosition.x + 1 == mine.gridPosition.x) && (this.player.gridPosition.y == mine.gridPosition.y)) {
                this.proximityCount++;
            }
            // top middle
            else if ((this.player.gridPosition.x == mine.gridPosition.x) && (this.player.gridPosition.y + 1 == mine.gridPosition.y)) {
                this.proximityCount++;
            }
            // bottom middle
            else if ((this.player.gridPosition.x == mine.gridPosition.x) && (this.player.gridPosition.y - 1 == mine.gridPosition.y)) {
                this.proximityCount++;
            }

            if ((this.player.gridPosition.x == mine.gridPosition.x) && (this.player.gridPosition.y == mine.gridPosition.y)) {
                this.collision = true;
            }
        }, this);

        if (this.collision) {
            this.proximityText.text = "GAME OVER";
        } else {
            this.proximityText.text = "Proximity: " + this.proximityCount;

        }


    },

    quitGame: function(pointer) {

        //	Here you should destroy anything you no longer need.
        //	Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //	Then let's go back to the main menu.
        this.state.start('MainMenu');

    }

};