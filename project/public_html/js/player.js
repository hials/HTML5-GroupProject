Player.prototype = Object.create(GameObject.prototype);

function Player(leftAttack, rightAttack) {
    GameObject.call(this);
    this.pos.x = 350;
    this.pos.y = 30;

    this.type = "player";

    var _imgPlayer = new ImageDrawer("player", 30, 70);
    var _imgStunned = new ImageDrawer("stunned", 20, 30);

    this.padding.right = _imgPlayer.width;
    this.padding.bottom = _imgPlayer.height;

    var _this = this;
    var playerRunSpeed = 35;
    var playerJumpHeight = 60;

    var _moving = false;
    var _groundDecel = 20;

    // The time of the last attack
    var _lastAttack = 0;
    // Delay between attacks
    var _attackDelay = 100; // milliseconds

    var _lastStunned = 0;
    // Delay before next stun is possible.
    var _stunnedDelay = 1000; // milliseconds


    this.draw = function (ctx) {
        var pos = this.getRealCoordinates(ctx);
        if (this.isStunned()) {
            _imgStunned.draw(ctx, pos.x + 5, pos.y - 40);
        }
        _imgPlayer.draw(ctx, pos.x, pos.y);
    };

    this.update = function (timedelta) {

        if (this.isStunned()) {
            // Prevent movement
            this.vel.x = 0;
        }
        else if (!_moving && this.pos.y == this.padding.bottom) {
            // Smoothly slow down the object when it is on the ground
            var diff = _groundDecel * timedelta;
            if (diff < Math.abs(this.vel.x))
                this.vel.x += -MathSign(this.vel.x) * diff;
            else
                this.vel.x = 0;
        }

        GameObject.prototype.update.call(this, timedelta);

        // Position the attacks next to the player
        rightAttack.pos.x = this.pos.x + this.padding.right + 5;
        rightAttack.pos.y = this.pos.y - 10;
        leftAttack.pos.x = this.pos.x - this.padding.left - leftAttack.padding.right - 5;
        leftAttack.pos.y = this.pos.y - 10;
    };

    this.collisionDetected = function (obj) {
        if (!this.isStunned() && obj.type == "enemy" &&
                ((new Date()).getTime() - _lastStunned) > _stunnedDelay &&
                !obj.isStunned()
                ) {
            this.stun();
            _setAttacksDisabled(true);
            setTimeout(function () {
                _lastStunned = (new Date()).getTime();
                _setAttacksDisabled(false);
            }, this.stunnedTimeout)
        }
    };

    var playerInput = new InputEvents();

    playerInput.on("moveright", function (released)
    {
        _this.setVelocity(playerRunSpeed, null);
        _moving = !released;
    });

    playerInput.on("moveleft", function (released)
    {
        _this.setVelocity(-playerRunSpeed, null);
        _moving = !released;
    });

    playerInput.on("jump", function ()
    {
        if (!_this.isStunned() && _this.pos.y == _this.padding.bottom)
        {
            _this.setVelocity(null, playerJumpHeight);
        }
    });

    playerInput.on("leftAttack", function (released)
    {
        if (!released && _canDoAttack()) {
            _executeAttack(leftAttack);
        }
    });

    playerInput.on("rightAttack", function (released)
    {
        if (!released && _canDoAttack()) {
            _executeAttack(rightAttack);
        }
    });

    function _canDoAttack() {
        return !_this.isStunned() && ((new Date()).getTime() - _lastAttack) > _attackDelay;
    }

    function _executeAttack(attack) {
        _lastAttack = (new Date()).getTime();
        _playAttackSound();
        attack.execute();

    }

    function _setAttacksDisabled(state) {
        leftAttack.setDisabled(state);
        rightAttack.setDisabled(state);
    }


    function _playAttackSound() {

        var sound_nr = Math.floor((Math.random() * 3)) + 1;
        RESOURCES.getSound("attack" + sound_nr).play();
    }
}


BaseAttack.prototype = Object.create(GameObject.prototype);

function BaseAttack(imageName) {
    GameObject.call(this);

    // this.img must be set in subclass

    this.padding.right = this.img.width;
    this.padding.bottom = this.img.height;
    this.type = "attack";
    this.hidden = true;
    var _temporaryDisabled = false;

    // The number of frames the attack currently has been visible
    this._visibleFrameCount = 0;
    this.setDisabled = function (disabled) {
        _temporaryDisabled = disabled;
    };

    this.update = function () {
        if (this.hidden)
            return;

        this._visibleFrameCount++;

        if (this._visibleFrameCount > 20)
            this.hidden = true;

        // The attack should not be affected by gravity so
        // we don't call the parent's update method.
    };

    this.execute = function () {
        this.hidden = false;
        this._visibleFrameCount = 0;
    };

    this.onWallHit = function (direction) {
        // do nothing
    };

    this.collisionDetected = function (obj) {
        if (!_temporaryDisabled && obj.type == "enemy" && !obj.isStunned()) {
            obj.takeHit();
            obj.stun();
            RESOURCES.getSound("enemyHit").play();
        }
    };
}


RightAttack.prototype = Object.create(BaseAttack.prototype);

function RightAttack(imageName) {

    this.img = new ImageDrawer("attack-right", 22, 40);

    BaseAttack.call(this);

    this.draw = function (ctx) {
        var pos = this.getRealCoordinates(ctx);
        ctx.save();
        // Rotate the image around the middle left edge
        ctx.translate(pos.x, pos.y + this.img.height / 2);
        ctx.rotate((this._visibleFrameCount * 6) * Math.PI / 180 - Math.PI / 2);
        this.img.draw(ctx, 0, -this.img.height / 2);
        ctx.restore();
    };
}

LeftAttack.prototype = Object.create(BaseAttack.prototype);

function LeftAttack(imageName) {

    this.img = new ImageDrawer("attack-left", 22, 40);
    BaseAttack.call(this);
    this.draw = function (ctx) {
        var pos = this.getRealCoordinates(ctx);
        ctx.save();
        // Rotate the image around the middle right edge
        ctx.translate(pos.x + this.img.width, pos.y + this.img.height / 2);
        ctx.rotate(-(this._visibleFrameCount * 6) * Math.PI / 180 + Math.PI / 2);
        this.img.draw(ctx, -this.img.width, -this.img.height / 2);
        ctx.restore();
    };
}
