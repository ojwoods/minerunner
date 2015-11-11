EnemyTank = function(game, player, bullets) {
    this.game = game;
    this.player = player;
    this.bullets = bullets;
    this.fireRate = 4000;
    this.nextFire = 0;
    this.bottomOfScreenY = (window.innerHeight * this.game.scale.scaleFactor.y);

    Phaser.Group.call(this, this.game);

    // Tank consists of a body and a turret

    this.tank = game.add.sprite(-100, 400, 'objectsSpritesheet', 'enemy_tank.png');
    this.turret = game.add.sprite(-100, 400, 'objectsSpritesheet', 'enemy_barrel.png');
    this.add(this.tank);
    this.add(this.turret);

    this.tank.anchor.set(0.5);
    this.turret.anchor.set(0.3, 0.5);
    this.tank.bringToTop();
    this.turret.bringToTop();

    this.tank.outOfBoundsKill = true;
    this.tank.checkWorldBounds = true;
    this.turret.outOfBoundsKill = true;
    this.turret.checkWorldBounds = true;

    game.physics.enable(this.tank, Phaser.Physics.ARCADE);
    this.tank.body.immovable = false;
    this.kill();

    //this.setAlive(false);
};

EnemyTank.prototype = Object.create(Phaser.Group.prototype);
EnemyTank.prototype.constructor = EnemyTank;

EnemyTank.prototype.setAlive = function(alive) {
    this.tank.alive = alive;
    this.turret.alive = alive;
    this.alive = alive;
}

EnemyTank.prototype.kill = function() {
    this.setAlive(false);
    this.tank.kill();
    this.turret.kill();
},

// Place the tank in a random X location on the game grid
EnemyTank.prototype.start = function(screenTopY, gridWidth, gridHeight, gridSize) {
    var gridSize2 = gridSize / 2;
    var startX = (this.game.rnd.between(0, gridWidth - 1) * gridSize) + gridSize2;
    var startY = screenTopY;
    this.setAlive(true);
    this.tank.reset(startX, startY);
    this.turret.reset(startX, startY);
},

EnemyTank.prototype.update = function() {
    // Kill if scrolled of the edge of the screen
    if (this.alive && (this.tank.y - this.game.camera.y) > this.bottomOfScreenY) {
        this.setAlive(false);
    }

    this.alive = this.tank.alive;

    if (this.alive) {
        // Rotate turret to point to player
        this.turret.x = this.tank.x;
        this.turret.y = this.tank.y;
        this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.player);

        // Fire bullet at player at preset fire rate
        if (this.game.physics.arcade.distanceBetween(this.tank, this.player) < 250) {
            if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0) {
                this.nextFire = this.game.time.now + this.fireRate;

                var bullet = this.bullets.getFirstDead();
                bullet.reset(this.turret.x, this.turret.y);

                // Rotate bullet to point at player
                bullet.rotation = this.game.physics.arcade.moveToObject(bullet, this.player, 50);
            }
        }
    }
};