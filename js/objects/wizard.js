var Sprite = require('../sprite.js');
var Jumpman = require('./jumpman.js');
var Boneheap = require('./boneheap.js');
var Util = require('../util/util.js');
var blocks = require('../objectArrays/blocks.js');
var metaBlocks = require('../objectArrays/metaBlocks.js');
var players = require('../objectArrays/players.js');
var movers = require('../objectArrays/movers.js');

var Wizard = function (index, x, y) {
  this.type = "wizard";
  this.index = index;
  this.pos = {
    x: x,
    y: y
  };
  this.speed = {
    x: 0,
    y: 0
  };
  this.facing = "right";
  this.frame = "right";
  this.accel = {
    x: 0,
    y: Util.universals.gravity
  };
  this.spriteRoot = "wizardpigeon";
  this.setSprites(6);
  this.sprite = this.sprites.standing_right;

  // STATS
  this.sightRange = 270;
  this.runSpeed = 4;
  this.jumpPower = 18;
  this.jumpDistance = 1.4;
  this.chasingSkill = 2.5;
  this.magicRange = 48;
  this.age = 0;
  this.deathStop = 20;
  this.dying = false;
};

Util.inherits(Wizard, Jumpman);

Wizard.prototype.animateTransformation = function () {
  if (this.age < 2) {
    this.spriteRoot = "wizardpigeon";
    this.setSprites(2);
  } else if (this.age === 4) {
    this.spriteRoot = "pigeonwizard";
    this.setSprites(2);
  } else if (this.age === 8) {
    this.spriteRoot = "wizard";
    this.setSprites(5);
  }
};

Wizard.prototype.checkForBoneheap = function () {
  var boneheap = Util.findByType("boneheap", movers);
  if (boneheap && Util.distanceBetween(this.pos, boneheap.pos) < this.magicRange) {
    this.speed.x = 0;
    boneheap.reanimate(this.index, this.pos.x, this.pos.y);
  }
};

Wizard.prototype.checkForHammer = function () {
  movers.forEach(function (mover) {
    if (mover.type === "hammer" &&
        Util.distanceBetween(this.pos, mover.pos) < this.sprite.height/2 &&
        mover.soft <= 0) {
      mover.ricochet();
      mover.soft = 8;
      this.die();
    }
  }.bind(this));
};

Wizard.prototype.checkForJumpBlock = function () {
  metaBlocks.forEach(function(metaBlock){
    if (this.pos.x < metaBlock.pos.x+this.sprite.width+2 &&
        this.pos.x > metaBlock.pos.x-2 &&
        this.pos.y < metaBlock.pos.y+this.sprite.height+2 &&
        this.pos.y > metaBlock.pos.y-2
       ) {
          if (metaBlock.types.includes("jumpRight") &&
            this.speed.x > 0) {
              this.jump();
            }
          if (metaBlock.types.includes("jumpLeft") &&
            this.speed.x < 0) {
              this.jump();
            }
          if (metaBlock.types.includes("switchJumpRight") &&
            this.pos.y-players[0].pos.y > -48 &&
            !(Util.distanceBetween(this.pos, players[0].pos) < this.sightRange &&
            players[0].pos.x < this.pos.x) &&
            this.speed.x > 0) {
              this.jump();
            }
          if (metaBlock.types.includes("switchJumpLeft") &&
            this.pos.y-players[0].pos.y > -48 &&
            !(Util.distanceBetween(this.pos, players[0].pos) < this.sightRange &&
            players[0].pos.x > this.pos.x) &&
            this.speed.x < 0) {
              this.jump();
            }
          if (metaBlock.types.includes("goLeft")) {
            this.speed.x = Math.abs(this.speed.x)*(-1);
          }
          if (metaBlock.types.includes("goRight")) {
            this.speed.x = Math.abs(this.speed.x);
          }
        }
  }.bind(this));
};

Wizard.prototype.die = function () {
  this.dying = true;
  this.updateSprite = function () {
    this.sprite = this.sprites.shrivel;
  };
};

Wizard.prototype.destroy = function () {
  delete movers[this.index];
};

Wizard.prototype.determineAction = function () {
  this.animateTransformation();
  this.facing = (this.speed.x < 0 ? "left" : "right");
  if (this.checkUnderFeet()) {
    while (Math.abs(this.speed.x) > this.runSpeed*this.jumpDistance) {
      this.speed.x *= 0.75;
    }
    var boneheap = Util.findByType("boneheap", movers);
    if (boneheap) {
      // Chance of going after a heap
      if (Math.random()*32 <= this.chasingSkill) {
        Util.xChase(this, boneheap.pos, this.runSpeed);
      }
    } else {
      this.wander();
    }
    this.checkForJumpBlock();
    this.checkForHammer();
    this.dodgeHammer();
  }
  if (this.pos.y > players[0].pos.y+(48*4)) {
    this.turnIntoABird();
  }
  if (this.dying) {
    this.deathStop --;
  }
  if (this.deathStop === 0) {
    this.destroy();
  }
  this.checkForBoneheap();
};

Wizard.prototype.dodgeHammer = function () {
  movers.forEach(function (mover) {

    if (mover.type === "hammer" &&
        Util.distanceBetween(this.pos, mover.pos) > this.sightRange/24 &&
        Util.distanceBetween(this.pos, mover.pos) < this.sightRange/2 ) {
      this.turnIntoABird();
    }
  }.bind(this));
};

Wizard.prototype.jump = function () {
  if (this.checkUnderFeet()) {
    this.speed.y = 0-this.jumpPower;
    this.speed.x *= this.jumpDistance;
    if (this.pos.x < 48*5 && this.speed.x < 0) {
      this.speed.x *= (-1);
    }
  }
};

Wizard.prototype.lowJump = function () {
  if (this.checkUnderFeet()) {
    this.speed.y = 0-this.jumpPower/1.3;
    this.speed.x *= this.jumpDistance;
    if (this.pos.x < 48*5 && this.speed.x < 0) {
      this.speed.x *= (-1);
    }
  }
};

Wizard.prototype.setExtraSprites = function () {
  this.sprites.shrivel = new Sprite(48, 48, 2, [
    this.spriteRoot+"/"+this.facing+"/shrivel/0.gif",
    this.spriteRoot+"/"+this.facing+"/shrivel/1.gif",
    this.spriteRoot+"/"+this.facing+"/shrivel/2.gif",
    this.spriteRoot+"/"+this.facing+"/shrivel/3.gif",
    this.spriteRoot+"/"+this.facing+"/shrivel/4.gif",
    this.spriteRoot+"/"+this.facing+"/shrivel/5.gif",
    this.spriteRoot+"/"+this.facing+"/shrivel/6.gif",
  ]);
};

Wizard.prototype.transmogrify = function () {
  var Pigeon = require('./pigeon.js');
  movers[this.index] = new Pigeon (this.index, this.pos.x, this.pos.y);
};

Wizard.prototype.turnIntoABird = function () {
  if (this.age > 21 && !this.dying) {
    this.spriteRoot = "pigeonwizard";
    this.setSprites(1);
    if (this.age % 248 === 0) {
      this.transmogrify();
    } else {
      this.age ++;
      this.turnIntoABird();
    }
  }
};

Wizard.prototype.wander = function () {
  if (Math.random()*256*(Math.abs(this.speed.x)+0.5) < 1) {
    this.speed.x = this.runSpeed;
  } else if (Math.random()*128 < 2) {
    this.speed.x = 0-this.runSpeed;
  }
};

module.exports = Wizard;