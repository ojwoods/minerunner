//  Here is a custom game object
PowerUp = function(game, x, y) {

    Phaser.Sprite.call(this, game, x, y, 'objectsSpritesheet', 'flat_medal1.png');
   
    this.type = null;
    game.physics.arcade.enable(this);
    this.anchor.setTo(0.5, 0.5);
    this.game = game;
    this.immovable = true;
    this.kill();
    this.frameName = 'starGold.png';

};


PowerUp.VIEW_BOMBS = "viewbombs";
PowerUp.PREVIEW = "preview";
PowerUp.prototype = Object.create(Phaser.Sprite.prototype);
PowerUp.prototype.constructor = PowerUp;

PowerUp.prototype.setType = function(type) {
    this.type = type;

    switch (type) {
        case PowerUp.VIEW_BOMBS:
            this.frameName = 'flat_medal1.png';
            break;
        case PowerUp.PREVIEW:
            this.frameName = 'flat_medal7.png';
            break;
    }
};

PowerUp.prototype.setRandomType = function() {
	var typeArray = [PowerUp.VIEW_BOMBS,PowerUp.PREVIEW];

    this.setType(this.game.rnd.pick(typeArray));

};

PowerUp.prototype.update = function() {

};