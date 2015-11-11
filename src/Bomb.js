//  Here is a custom game object
Bomb = function(game, x, y) {

    Phaser.Sprite.call(this, game, x, y, 'objectsSpritesheet', 'bomb-warn.png');
    game.physics.arcade.enable(this);
    this.anchor.setTo(0.5,0.5);
    this.game = game;

};

Bomb.prototype = Object.create(Phaser.Sprite.prototype);
Bomb.prototype.constructor = Bomb;

/**
 * Automatically called by World.update
 */
Bomb.prototype.update = function() {


};