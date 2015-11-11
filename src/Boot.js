BasicGame = {

    /* Here we've just got some global level vars that persist regardless of State swaps */
    score: 0,

    /* If the music in your game needs to play through-out a few State swaps, then you could reference it here */
    music: null,

    /* Your game can check BasicGame.orientated in internal loops to know if it should pause or not */
    orientated: false

};

BasicGame.Boot = function(game) {};

BasicGame.Boot.prototype = {

    init: function() {

        this.input.maxPointers = 1;
        this.stage.disableVisibilityChange = true;
        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas); //for Canvas, modern approach

        PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST; //for WebGL
        if (this.game.device.desktop) {
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
            this.scale.refresh();
        } else {
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
            this.scale.forceOrientation(true, false);
            this.scale.refresh();
        }
    },

    preload: function() {
        //  Here we load the assets required for our preloader (in this case a background and a loading bar)
        this.load.image('preloaderBackground', 'images/preloader_background.jpg');
        this.load.image('preloaderBar', 'images/preloadr_bar.png');

    },

    create: function() {
        this.state.start('Preloader');
    },

    gameResized: function(width, height) {
        //  This could be handy if you need to do any extra processing if the game resizes.
        //  A resize could happen if for example swapping orientation on a device or resizing the browser window.
        //  Note that this callback is only really useful if you use a ScaleMode of RESIZE and place it inside your main game state.
    },

    enterIncorrectOrientation: function() {
        BasicGame.orientated = false;
        document.getElementById('orientation').style.display = 'block';
    },

    leaveIncorrectOrientation: function() {

        BasicGame.orientated = true;
        document.getElementById('orientation').style.display = 'none';
    }

};