//  Here is a custom game object
Player = function(game, x, y) {

    Phaser.Sprite.call(this, game, x, y, 'objectsSpritesheet', 'tankBlue.png');

    this.type = null;
    game.physics.arcade.enable(this);
    this.anchor.setTo(0.5, 0.5);
    this.game = game;
    this.immovable = true;

    this.anim = this.animations.add('death', [
        'smokeGrey0.png',
        'smokeGrey1.png',
        'smokeGrey2.png',
        'smokeGrey3.png',
        'smokeGrey4.png',
        'smokeGrey5.png',
        'smokeGrey4.png',
        'smokeGrey3.png',
        'smokeGrey2.png',
        'smokeGrey1.png',
        'smokeGrey0.png',
    ]);

};


Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;
Player.prototype.setDead = function(callback, context) {
    // play animation
    this.alive = false;
    this.anim.onComplete.addOnce(callback, context);


    this.anim.play(5, false);
};

Player.prototype.update = function() {

};