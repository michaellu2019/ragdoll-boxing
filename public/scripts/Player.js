/**
 * Game object class to update and render the player
 */ 

/**
 * player game object
 * @class Player
 * @constructor
 * @param {Boolean} bot, true if the player is controlled by the computer, false otherwise
 * @param {Number} x, x position of the player's body
 * @param {Number} y, y position of the player's body
 * @param {Number} z, z position of the player's body
 * @param {Number} radiusTop, top radius of the player's body
 * @param {Number} radiusBottom, bottom radius of the player's body
 * @param {Number} height, height of the player's body
 * @param {Number} orientation, either 1 or -1 representing which direction of the z-axis the player faces
 * @param {Number} mass, mass of the player
 * @param {String} color, String representation of the player's color
 */
function Player(bot, x, y, z, radiusTop, radiusBottom, height, orientation, mass, color, image = null, imageFace = null) {
  this.bot = bot;
  this.restPosition = new CANNON.Vec3(x, y, z);
  this.rotation = new CANNON.Vec3(0, 0, 0);
  this.radiusTop = radiusTop;
  this.radiusBottom = radiusBottom;
  this.height = height;
  this.color = color;
  this.orientation = orientation;
  this.opponent = null;

  this.body = new Frustum(x, y, z, radiusTop, radiusBottom, height, mass, color);
  this.body.angularDamping = 0.001;
  this.base = new Box(x, y - height * 0.6, z, radiusBottom, height * 0.1, radiusBottom, 0, color);

  // render an image on the player's face if one is passed in
  if (image == null || imageFace == null) {
    this.head = new Sphere(x, y + height * 0.8, z, sizeScale * 0.4, mass * 0.8, color);
  } else {
    this.head = new Sphere(x, y + height * 0.8, z, sizeScale * 0.4, mass * 0.8, color, image, imageFace);
  }
  

  // connect the head to the body with a spring
  this.headSpring = new CANNON.Spring(this.head.body, this.body.body, {
    restLength: this.head.radius * 0.75,
    stiffness: mass * 500,
    damping: mass * 10,
    localAnchorA: new CANNON.Vec3(0, this.head.radius * -0.5, 0),
    localAnchorB: new CANNON.Vec3(0, this.body.height * 0.5, 0),
  });

  // connect the body to a small base with a spring
  this.bodySpring = new CANNON.Spring(this.body.body, this.base.body, {
		restLength: this.base.height * 0.75,
		stiffness: mass * 250,
		damping: mass * 10,
		localAnchorA: new CANNON.Vec3(0, this.body.height * -0.5, 0),
		localAnchorB: new CANNON.Vec3(0, this.base.height * 0.5, 0),
	});

  this.leftFist = new Fist(this, x + sizeScale * -0.5, y + sizeScale * 0.5, z + sizeScale * -orientation * 0.5, x, y, z, sizeScale * 0.25, leftOrientation, massScale * 10, color);
  this.rightFist = new Fist(this, x + sizeScale * 0.5, y + sizeScale * 0.5, z + sizeScale * -orientation * 0.5, x, y, z, sizeScale * 0.25, rightOrientation, massScale * 10, color);
}

/**
 * Set the player's opponent field to another player to fight
 * @method setOpponent
 * @param {Player} opponent, the other player object the player is to fight
 */
Player.prototype.setOpponent = function(opponent) {
  this.opponent = opponent;
}

/**
 * Set the player's set of punch moves field to the given move set, and set the move set's player
 * @method addMoveSet
 * @param {MoveSet} moveSet, the set of punch moves the player is to perform
 */
Player.prototype.addMoveSet = function(moveSet) {
	this.moveSet = moveSet;
  moveSet.player = this;
}

/**
 * Have a player perform the given punches at the given acceleration values
 * @method punch
 * @param {Array} punches, the left and right punch moves the player is to perform
 * @param {Array} accs, the left and right arrays of acceleration values the player is to perform the punch at
 */
Player.prototype.punch = function(punches, accs) {
  this.leftFist.punch(punches[0], accs[0], -this.orientation);
  this.rightFist.punch(punches[1], accs[1], -this.orientation);

  if (this.moveSet != null) {
    this.moveSet.advance(punches);
  }
}

/**
 * Update the player and its components
 * @method update
 */
Player.prototype.update = function() {
  this.headSpring.applyForce();
  this.bodySpring.applyForce();

  this.leftFist.update();
  this.rightFist.update();

  this.head.update();
	this.body.update();
  this.base.update();
  
  this.leftFist.transform(this.body.body.quaternion);
  this.rightFist.transform(this.body.body.quaternion);
}