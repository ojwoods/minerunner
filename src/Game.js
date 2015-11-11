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
    this.PLAYER_TOP_OFFSET = 0;
};

BasicGame.Game.prototype = {
    GRIDSIZE: 32,
    GRIDSIZE2: 16,
    GRIDSIZE_STR: "32",
    GRID_HEIGHT: 8,
    GRID_WIDTH: 6,
    PLAYER_SCROLL_HEIGHT: 4,
    PLAYER_TOP_OFFSET: 0,
    GAME_HEIGHT: 0,
    MINE_TILE: 1,
    ROAD_TILE: 12,
    GRASS_TILE: 2,
    TREE_TILE: 10,
    tilesprite: null,
    map: null,
    mapLayer1: null,
    cursors: null,
    player: null,
    playerInvincible: false,
    currentMove: {},
    proximityCount: 0,
    score: 0,
    collision: false,
    currentRow: 0,
    playerGridRef: 0,
    doMovePlayer: false,
    marker: {},
    thing: 0,
    lastMineTile: null,
    greenTile: null,
    tracksTile: null,
    roadNdx: 5,
    weightedRoadDirection: [0, 1, 2, 3, 4],
    roadTurnValue: 0,
    lastRowHadTurn: false,
    collectablesGroup: null,
    difficultyLevel: 0,
    enemyBullets: null,
    enemiesGroup: null,
    enemyTanksGroup: null,
    powerUpsGroup: null,
    bombsGroup: null,
    enemyBomberGroup: null,
    actorsGroup: null,



    create: function() {
        var bottomOfScreenY = 0;

        this.GAME_HEIGHT = this.stage.height;
        this.GRID_HEIGHT = (this.GAME_HEIGHT / this.GRIDSIZE);
        this.GRID_WIDTH = (this.stage.width / this.GRIDSIZE);
        this.PLAYER_TOP_OFFSET = this.GRIDSIZE * ((this.GRID_HEIGHT / 3) * 2) + this.GRIDSIZE / 2;

        this.game.stage.backgroundColor = '#009900';
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.game.world.setBounds(0, 0, this.stage.width, this.GAME_HEIGHT * 2);
        this.game.camera.y = this.GAME_HEIGHT;

        //  Creates a blank tilemap
        this.map = this.game.add.tilemap('terrain');
        this.map.setPreventRecalculate(true);
        this.map.addTilesetImage('maptiles', 'maptiles');
        this.mapLayer1 = this.map.createLayer('Main');
        this.mapLayer1.resizeWorld();


        // Setup the player
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.player = new Player(this.game, ((this.GRID_WIDTH / 2) * this.GRIDSIZE) + this.GRIDSIZE / 2, this.GAME_HEIGHT + this.PLAYER_TOP_OFFSET);

        this.createGameObjects();

        // Work out where the bottom of the screen is, taking into account screen resolution
        bottomOfScreenY = (window.innerHeight * this.game.scale.scaleFactor.y);

        // Font styles
        var proximityStyle = {
            font: "25px Arial",
            fill: "#fff",
            align: "center"
        };
        var scoreStyle = {
            font: "25px Arial",
            fill: "#fff",
            align: "center"
        };


        // Setup game text
        this.proximityText = this.game.add.text(this.game.world.centerX, 30, "Adjacent mines: " + this.proximityCount, proximityStyle);
        this.proximityText.anchor.set(0.5, 0);
        this.proximityText.fixedToCamera = true;

        this.scoreText = this.game.add.text(this.game.world.centerX, 10, "Score: " + this.score, scoreStyle);
        this.scoreText.anchor.set(0.5, 0);
        this.scoreText.fixedToCamera = true;

        // Get grid reference of top of the screen
        this.currentRow = this.getGridRef(this.game.camera).y;
        this.currentMove.screenUp = false;
        this.currentMove.screenDown = false;
        this.currentMove.playerMoving = false;

        // Grid reference of current player location
        this.playerGridRef = this.getGridRef(this.player);

        // Add 'used' marker at current player location
        this.addMarkerTile();

        // Keyboard events callback
        this.input.onUp.add(this.movePlayer, this);

        this.startGame();
    },

    startGame: function() {
        this.collectablesGroup.callAll('kill');
        this.difficultyLevel = 0;

        // Procudurally generate terrain for first screen
        roadNdx = this.getGridRef(this.player).x;
        for (this.currentRow = this.getGridRef(this.player).y - 2; this.currentRow > this.getGridRef(this.game.camera).y - 1; this.currentRow--) {
            this.drawNextRow(false);
        }

        // Udate proxitity of nearest mines
        this.updateProximityCount();

        // Flash where the mines are for a brief period
        this.showBombs2();
        playerInvincible = false;
    },

    update: function() {
        // Check for collisions between collectables group and powerups group
        this.game.physics.arcade.collide(this.player, this.collectablesGroup, this.collectableCollisionHandler, this.collectableCollisionHandler, this);
        this.game.physics.arcade.collide(this.player, this.powerUpsGroup, this.powerUpCollisionHandler, this.powerUpCollisionHandler, this);

        // Update references to the current top row and player location
        this.currentRow = this.getGridRef(this.game.camera).y;
        this.playerGridRef = this.getGridRef(this.player);

        // Move player to new location
        if (!this.currentMove.playerMoving && this.player.alive) {
            if (this.touchedTile) {
                if (this.touchedTile.y < this.playerGridRef.y - 1) {
                    this.moveUp();
                } else if (this.touchedTile.y > this.playerGridRef.y - 1) {
                    this.moveDown();
                } else if (this.touchedTile.x < this.playerGridRef.x - 1) {
                    this.moveHorizontal(true);
                } else if (this.touchedTile.x > this.playerGridRef.x - 1) {
                    this.moveHorizontal(false);
                }
                this.touchedTile = null;
            } else if (this.cursors.up.isDown) {
                this.moveUp();
            } else if (this.cursors.down.isDown) {
                this.moveDown();
            } else if (this.cursors.left.isDown) {

                this.moveHorizontal(true);
            } else if (this.cursors.right.isDown) {

                this.moveHorizontal(false);
            }
        }
        // Update camera
        if (this.currentMove.screenUp) {
            this.game.camera.y = this.player.y - this.PLAYER_TOP_OFFSET;
        }

        // Kill collectables objects if they have scrolled off the screen
        this.collectablesGroup.forEach(function(item) {
            // Update alpha first.
            if (item.alive && item.y - this.camera.y > this.GAME_HEIGHT) {
                console.log("killing star");

                item.kill();
            }
        }, this);

        // Check for collision with bullets if not invinsible
        if (!this.playerInvincible) {
            this.game.physics.arcade.overlap(this.enemyBullets, this.player, this.gameOver, null, this);
        }

        // Update the tanks
        this.enemyTanksGroup.forEach(function(enemy) {
            // Update alpha first.
            if (enemy.alive) {
                enemy.update();
            }
        }, this);

        // Update the bombers
        this.enemyBomberGroup.forEach(function(enemy) {
            // Update alpha first.
            if (enemy.alive) {
                enemy.update();
            }
        }, this);
    },

    render: function() {

        // this.game.debug.cameraInfo(this.game.camera, 0, 32);
        //this.game.debug.spriteCoords(this.player, 32, 32);

    },

    movePlayer: function() {
        // Get the tile that the user has clicked on. Determines the direction the player tank will move
        this.touchedTile = this.map.getTileWorldXY(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY, 32, 32, 0);
    },

    moveUp: function() {
        // Move player  up the grid by one

        // Is the tile above ok to move to?
        var aboveTile = this.map.getTile(this.playerGridRef.x - 1, this.playerGridRef.y - 2, 0);
        if (aboveTile.properties.hasOwnProperty("canLayMine") && aboveTile.properties.canLayMine === false) {
            return;
        }

        // Tween to move the tank location up
        this.game.add.tween(this.player).to({

            y: "-" + this.GRIDSIZE_STR,
            angle: 0
        }, 350, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {
            this.game.camera.y = Phaser.Math.roundTo(this.game.camera.y, 0);

            // Do we need to swap the map?
            this.checkScreenSwap();

            // Draw the next row
            this.drawNextRow(false);

            // Show an enemy tank?
            this.showEnemyTank();

            // Update row, score and difficulty level
            this.currentMove.playerMoving = false;
            if (this.currentMove.screenUp) {
                this.currentRow++;

                this.updateScore();
                this.updateDifficultyLevel();
            }
            this.currentMove.screenUp = false;
            this.currentMove.screenDown = false;

            // Determine how close the nearest mines are
            this.updateProximityCount();

            // Add a 'used' marker where the tank has alreay been
            this.addMarkerTile();
        }, this);


        this.currentMove.playerMoving = true;
        this.currentMove.screenDown = false;

        if (this.playerGridRef.relativeY <= ((this.GRID_HEIGHT / 3) * 2) + 1) {
            this.currentMove.screenUp = true;
        }

        // Show any baddies?
        this.showBaddies();
    },

    moveDown: function() {
        // Move player down the grid by one

        // Is the tile above ok to move to?
        var belowTile = this.map.getTile(this.playerGridRef.x - 1, this.playerGridRef.y, 0);
        if (belowTile.properties.hasOwnProperty("canLayMine") && belowTile.properties.canLayMine === false) {
            return;
        }

        if (this.playerGridRef.relativeY <= this.GRID_HEIGHT - 1) {

            //  Tween to move the tank location up
            this.game.add.tween(this.player).to({

                y: this.GRIDSIZE_STR,
                angle: -180
            }, 350, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {
                this.currentMove.playerMoving = false;
                this.currentMove.screenUp = false;
                this.currentMove.screenDown = false;

                // Determine how close the nearest mines are
                this.updateProximityCount();

                // Add a 'used' marker where the tank has alreay been
                this.addMarkerTile();
            }, this);


            this.currentMove.playerMoving = true;
            this.currentMove.screenUp = false;
            this.currentMove.screenDown = true;
        }

        // Show any baddies?
        this.showBaddies();
    },

    moveHorizontal: function(left) {
        // Move player left or right on the grid by one
        var moveVector = 0;
        var nextTile = null;
        var tweenAngle = 90;

        // Is the tile above ok to move to?
        if (left) {
            nextTile = this.map.getTile(this.playerGridRef.x - 2, this.playerGridRef.y - 1, 0);
            moveVector = "-" + this.GRIDSIZE_STR;
            tweenAngle = -90;
        } else {
            nextTile = this.map.getTile(this.playerGridRef.x, this.playerGridRef.y - 1, 0);
            moveVector = this.GRIDSIZE_STR;
        }

        if (nextTile.properties.hasOwnProperty("canLayMine") && nextTile.properties.canLayMine === false) {
            return;
        }

        //  Tween to move the tank location up
        this.game.add.tween(this.player).to({
            x: moveVector,
            angle: tweenAngle
        }, 350, Phaser.Easing.Cubic.InOut, true).onComplete.addOnce(function() {
            this.currentMove.playerMoving = false;
            this.currentMove.screenUp = false;
            this.currentMove.screenDown = false;

            // Determine how close the nearest mines are
            this.updateProximityCount();

            // Add a 'used' marker where the tank has alreay been
            this.addMarkerTile();

        }, this);

        this.currentMove.playerMoving = true;
        this.currentMove.screenUp = false;
        this.currentMove.screenDown = false;

        // Show any baddies?
        this.showBaddies();
    },

    checkScreenSwap: function() {
        //
        // Map is only two screen high, if it gets to the end of the second screen, we swap
        // to the first screen, which has been created as a duplicate of the second.
        //
        if (Phaser.Math.roundTo(this.game.camera.y, 0) === 0) {
            this.drawNextRow(true);

            // Swap all objects to the second screen
            this.swapAllObjects(this.actorsGroup);

            // Update game pointers to the new swapped screen
            this.game.camera.y = this.GAME_HEIGHT;
            this.currentRow = this.getGridRef(this.game.camera).y;
            this.playerGridRef = this.getGridRef(this.player);

        }
        return false;
    },

    swapAllObjects: function(group) {
        // Move objects from the second screen to the first after swapping
        for (var i = 0; i < group.children.length; i++) {
            if ((group.children[i].alive)) {
                if (group.children[i] instanceof Phaser.Group) {
                    this.swapAllObjects(group.children[i]);
                } else {
                    if (group.children[i].y < this.GAME_HEIGHT) {
                        group.children[i].y += this.GAME_HEIGHT;
                    }
                }
            }
        }
    },
    quitGame: function(pointer) {
        //	Then let's go back to the main menu.
        this.state.start('MainMenu');

    },

    getGridRef: function(object) {
        var gridPosition = {}; // This may be inefficient

        gridPosition.x = Phaser.Math.roundAwayFromZero(object.x / this.GRIDSIZE);
        gridPosition.y = Phaser.Math.roundAwayFromZero(object.y / this.GRIDSIZE);
        gridPosition.relativeY = gridPosition.y - this.currentRow;
        return gridPosition;
    },

    drawNextRow: function(onlyCopy) {
        //
        // Procedurally generate the map, one row at a time.
        // We also draw the new row on a hidden second 'buffer' screen so that when it swaps over, it is 
        // an identical copy
        //

        if (!onlyCopy) {
            // 
            // Figure out where the (long and) winding road should turn next
            //
            if (!this.lastRowHadTurn) // Prevent 2 turns in a row
            {
                this.roadTurnValue = this.game.rnd.weightedPick(this.weightedRoadDirection);
                this.lastRowHadTurn = true;
            } else {
                this.roadTurnValue = 0;
                this.lastRowHadTurn = false;
            }
            var roadLeft = Phaser.Math.clamp(this.roadNdx - this.roadTurnValue, 0, this.GRID_WIDTH);
            var roadRight = Phaser.Math.clamp(this.roadNdx + this.roadTurnValue, 0, this.GRID_WIDTH - 1);
            var newRoadNdx = this.game.rnd.between(roadLeft, roadRight);

            roadLeft = Phaser.Math.min(newRoadNdx, this.roadNdx);
            roadRight = Phaser.Math.max(newRoadNdx, this.roadNdx);
            this.roadNdx = newRoadNdx;

            //  Create the new row with random elements
            for (var ndx = 0; ndx < this.GRID_WIDTH; ndx++) {
                var tileNdx = GRASS_TILE;

                // Should the tile be a road?
                if (ndx >= roadLeft && ndx <= roadRight) {
                    tileNdx = ROAD_TILE;
                } else if (this.game.rnd.between(0, 6) === 0) {
                    tileNdx = TREE_TILE;
                }
                var tile = this.map.putTile(tileNdx, ndx, this.currentRow - 1, 0);

                if (tile && tile.properties) {
                    tile.properties.isMine = false;

                    // Cannot lay mine on a tree
                    if (tileNdx == TREE_TILE) {
                        tile.properties.canLayMine = false;
                    } else {
                        tile.properties.canLayMine = true;
                    }
                }
            }

            // Work out if and where a mine should go on ths row
            var chanceOfMine = 0;
            if (this.difficultyLevel < 5) {
                chanceOfMine = this.game.rnd.between(0, 1);
            }
            if (chanceOfMine === 0) {
                var xTile = this.game.rnd.between(0, this.GRID_WIDTH - 1);
                var mineTile = this.map.getTile(xTile, this.currentRow - 1, 0);
                if (mineTile && mineTile.properties && mineTile.properties.canLayMine) {
                    mineTile.properties.isMine = true;
                }
            }
        }

        // Duplicate this row to the hidden second buffer screen
        for (var ndx2 = 0; ndx2 < this.GRID_WIDTH; ndx2++) {
            var copyTile = this.map.getTile(ndx2, this.currentRow, 0);
            if (copyTile) {
                this.map.putTile(copyTile, ndx2, this.currentRow + this.GRID_HEIGHT, 0);
            }
        }

        // Shall we put a collecatble object on this row>?
        this.showCollectable();
    },


    addMarkerTile: function() {
        // Add a marker to show where the player has already been
        if (!this.player.alive) {
            return;
        }
        var mirrorRow = this.playerGridRef.y - 1 + this.GRID_HEIGHT * 2;

        this.map.putTile(3 + this.proximityCount, this.playerGridRef.x - 1, this.playerGridRef.y - 1, 0);

        // Put on the second buffer screen as well
        this.map.putTile(3 + this.proximityCount, this.playerGridRef.x - 1, this.playerGridRef.y - 1 + this.GRID_HEIGHT, 0);
    },

    updateScore: function() {
        this.score++;
        this.scoreText.text = "Score: " + this.score;

    },
    updateDifficultyLevel: function() {
        this.difficultyLevel++;
    },


    updateProximityCount: function() {
        // Work out how many mines are surrounding the player
        this.proximityCount = 0;
        this.collision = false;
        var currentTile = null;
        for (var xNdx = -2; xNdx < 1; xNdx++) {
            for (var yNdx = -2; yNdx < 1; yNdx++) {
                currentTile = this.map.getTile(this.playerGridRef.x + xNdx, this.playerGridRef.y + yNdx, 0);
                if (currentTile && currentTile.properties) {
                    if (currentTile.properties.isMine) {
                        this.proximityCount++;
                    }
                }
            }
        }

        // Has the player entered a grid location with a mine?
        // MOVE THIS INTO SEPERATE FUNCTION!
        currentTile = this.map.getTile(this.playerGridRef.x - 1, this.playerGridRef.y - 1, 0);

        if (currentTile.properties && currentTile.properties.isMine) {
            this.collision = true;
        }
        if (this.collision) {
            this.gameOver();
        } else {
            this.proximityText.text = "Adjacent Mines: " + this.proximityCount;
        }

        this.proximityText.scale.x = 1;
        this.proximityText.scale.y = 1;

        // Show an animation to let the user know the proximity to a mine has changed
        if (this.proximityCount > 0) {
            this.game.add.tween(this.proximityText.scale).to({
                x: 1.1,
                y: 0.8
            }, 200, Phaser.Easing.Cubic.InOut, true, 0, 1, true);
        }
    },


    showBombs: function() {
        // Flash the location of the mines for a brief period
        var currentTile = null;

        for (var yNdx = 0; yNdx < this.GRID_HEIGHT * 2; yNdx++) {
            for (var xNdx = 0; xNdx < this.GRID_WIDTH; xNdx++) {
                currentTile = this.map.getTile(xNdx, yNdx, 0);
                if (currentTile.properties && currentTile.properties.isMine) {
                    currentTile.index = 11;
                }
            }
        }
        this.mapLayer1.dirty = true;
    },

    showBombs2: function() {
        var currentTile = null;

        // Flash the location of the mines for a brief period
        for (var yNdx = 0; yNdx < this.GRID_HEIGHT * 2; yNdx++) {
            for (var xNdx = 0; xNdx < this.GRID_WIDTH; xNdx++) {
                currentTile = this.map.getTile(xNdx, yNdx, 0);
                if (currentTile.properties && currentTile.properties.isMine) {
                    var bomb = this.bombsGroup.getFirstDead();
                    if (!bomb) {
                        bomb = new Bomb(this.game, currentTile.worldX + this.GRIDSIZE2, currentTile.worldY + this.GRIDSIZE2);

                        this.game.add.existing(bomb);
                        this.bombsGroup.add(bomb);
                    } else {
                        bomb.reset(currentTile.worldX + this.GRIDSIZE2, currentTile.worldY + this.GRIDSIZE2);
                    }
                    bomb.alpha = 0;

                    // Flash the alpha a few times
                    this.game.add.tween(bomb).to({
                        alpha: 1
                    }, 300, Phaser.Easing.Cubic.InOut, true, 0, 3, true).onComplete.addOnce(function() {
                        this.kill();
                    }, bomb);

                }
            }
        }
        this.mapLayer1.dirty = true;
    },

    invinciblityPowerUp: function() {
        this.playerInvincible = true;
        this.game.add.tween(this.player).to({
            alpha: 0
        }, 300, Phaser.Easing.Cubic.InOut, true, 0, 10, true).onComplete.addOnce(function() {
            this.playerInvincible = false;
        }, this);
    },

    gameOver: function() {
        if (this.playerInvincible) {
            return;
        }
        this.proximityText.text = "GAME OVER";

        this.player.setDead(function() {
            this.player.kill();

            this.showBombs2();

            setTimeout(function() {
                location.reload();
            }, 3000);
        }, this);


    },
    createGameObjects: function() {

        this.collectablesGroup = this.game.add.group();
        this.actorsGroup = this.game.add.group();
        this.bombsGroup = this.game.add.group();
        this.powerUpsGroup = this.game.add.group();


        //  The enemies bullet group
        this.enemyBullets = this.game.add.group();
        this.enemyBullets.enableBody = true;
        this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.enemyBullets.createMultiple(5, 'objectsSpritesheet', 'enemy_bullet.png');

        this.enemyBullets.setAll('anchor.x', 0.5);
        this.enemyBullets.setAll('anchor.y', 0.5);
        this.enemyBullets.setAll('outOfBoundsKill', true);
        this.enemyBullets.setAll('checkWorldBounds', true);

        // Bonus collectables
        for (var starsNdx = 0; starsNdx < 5; starsNdx++) {
            var star = this.game.add.sprite(-100, -100, 'objectsSpritesheet', 'person.png');
            star.anchor.setTo(0.5, 0.5);
            star.animations.add('wave', [
                'person.png',
                'person2.png'

            ], 50, true, false);

            star.animations.play('wave', 5, true);

            this.collectablesGroup.add(star);
            star.immovable = true;
            this.game.physics.arcade.enableBody(star);
        }

        // Bonus collectables
        for (var powerUpsNdx = 0; powerUpsNdx < 5; powerUpsNdx++) {
            var powerUp = new PowerUp(this.game, -100, -100);

            this.powerUpsGroup.add(powerUp);

        }

        //  Create some baddies to waste :)
        this.enemyBomberGroup = this.game.add.group();
        this.enemiesGroup = this.game.add.group();
        this.enemyTanksGroup = this.game.add.group();
        this.enemyBomberGroup.add(new EnemyBomber(this.game, this.player));

        for (var ndx = 0; ndx < 3; ndx++) {
            this.enemyTanksGroup.add(new EnemyTank(this.game, this.player, this.enemyBullets));
        }


        this.actorsGroup.add(this.collectablesGroup);
        this.actorsGroup.add(this.enemyBullets);
        this.actorsGroup.add(this.player);
        this.actorsGroup.add(this.enemyTanksGroup);
        this.actorsGroup.add(this.enemyBomberGroup);
    },

    collectableCollisionHandler: function(player, collectable) {
        collectable.kill();
        this.updateScore();
    },
    powerUpCollisionHandler: function(player, collectable) {
        collectable.kill();

        switch (collectable.type) {
            case PowerUp.VIEW_BOMBS:
                this.showBombs2();
                break;
            case PowerUp.PREVIEW:
                this.invinciblityPowerUp();
                break;
        }
    },

    showBaddies: function() {
        /* Trigger Bomber ? */
        var showBomber = this.game.rnd.between(0, 20 - this.difficultyLevel);
        if (showBomber === 0) {
            var newBomber = this.enemyBomberGroup.getFirstDead();
            if (newBomber) {
                newBomber.fire(this.game.camera.y, this.GRID_WIDTH, this.GRID_HEIGHT, this.GRIDSIZE);
            }
        }
    },

    showEnemyTank: function() {
        var showTank = this.game.rnd.between(0, 20 - this.difficultyLevel);
        if (showTank === 0) {
            var newTank = this.enemyTanksGroup.getFirstDead();
            if (newTank) {
                newTank.start(this.game.camera.y, this.GRID_WIDTH, this.GRID_HEIGHT, this.GRIDSIZE);
            }
        }
    },

    showCollectable: function() {
        // Show Objects
        var randomBonus = this.game.rnd.between(0, 10);
        var bonusX = this.game.rnd.between(0, this.GRID_WIDTH - 1);
        var bonusTile = this.map.getTile(bonusX, this.currentRow - 1, 0);

        if (bonusTile && bonusTile.properties && bonusTile.properties.canLayMine && !bonusTile.properties.isMine) {
            switch (randomBonus) {
                case 0:
                    var collectable = this.collectablesGroup.getFirstDead(false);

                    collectable.reset((bonusX * this.GRIDSIZE) + this.GRIDSIZE / 2, ((this.currentRow - 1) * this.GRIDSIZE) + this.GRIDSIZE / 2);
                    collectable.revive();
                    break;
                case 1:
                    var powerUp = this.powerUpsGroup.getFirstDead(false);
                    if (powerUp) {
                        powerUp.reset((bonusX * this.GRIDSIZE) + this.GRIDSIZE / 2, ((this.currentRow - 1) * this.GRIDSIZE) + this.GRIDSIZE / 2);
                        powerUp.revive();
                        powerUp.setRandomType();
                    }
                    break;
                case 2:
                    break;
            }
        }
    },
};