PowerUpInvincible= function(game, x, y) {

    Phaser.Sprite.call(this, game, x, y, 'objectsSpritesheet', 'flat_medal7.png');
    game.physics.arcade.enable(this);
    this.anchor.setTo(0.5,0.5);
    this.game = game;
     this.immovable = true;
     this.kill();

};

PowerUpInvincible.prototype = Object.create(Phaser.Sprite.prototype);
PowerUpInvincible.prototype.constructor = PowerUpInvincible;

/**
 * Automatically called by World.update
 */
PowerUpInvincible.prototype.update = function() {


};