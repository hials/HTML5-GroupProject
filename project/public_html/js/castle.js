RESOURCES.addImage("castle", "img/castle.png");

Castle.prototype = Object.create(GameObject.prototype);

function Castle(game) {
    GameObject.call(this);
    this.pos.x = 390;
    this.pos.y = 100;

    var _this = this;

    this.type = "castle";

    this.acc.x = 0;
    this.acc.y = 0;
    this.vel.x = 0;
    this.vel.y = 0;


    // The padding is a little smaller than 
    // the image to make the enemies go slightly into 
    // the castle before they disappear.
    this.padding.left = 0;
    this.padding.right = 120;
    this.padding.bottom = 120;
    this.padding.top = 0;

    this.hp = 20;

    this.draw = function(ctx) {
        var pos = this.getRealCoordinates(ctx);
        ctx.font="12px sans-serif";
        ctx.fillText(this.hp, pos.x + 50, pos.y-20);
        // Draw the image a little outside the padding
        ctx.drawImage(RESOURCES.getImage("castle"), pos.x-20, pos.y-20, 160, 120);
    };


    this.collisionDetected = function(obj){
        if(obj.type == "enemy" && !obj.deleted){
            obj.destroy();
            this.takeHit();
            if(this.hp == 0){
                game.gameOver();
                return;
            }
            if(!this.isStunned())
                this.stun();
        }
    };

    this.onWallHit = function(){
        // Do nothing
    };
}
