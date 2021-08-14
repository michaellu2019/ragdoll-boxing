/**
 * Game object class to update and render the punching bag
 */ 

/**
 * punching bag game object
 * @class Bag
 * @constructor
 * @param {Number} x, x position of the punching bag
 * @param {Number} y, y position of the punching bag
 * @param {Number} z, z position of the punching bag
 * @param {Number} radius, radius of the punching bag cylinder
 * @param {Number} height, height of the punching bag height
 * @param {Number} mass, mass of the punching bag
 * @param {String} color, String representation of the punching bag color
 */
function Bag(x, y, z, radius, height, mass, color) {
  this.base = new Box(x, y - height * 1.1, z, radius * 0.1, radius * 0.1, radius * 0.1, 0, color);
  this.bag = new Frustum(x, y, z, radius, radius, height, mass, color);

  // connect the bag to a small base with a spring
  this.spring = new CANNON.Spring(this.bag.body, this.base.body, {
		restLength: this.base.height * 0.75,
		stiffness: mass * 250,
		damping: mass * 10,
		localAnchorA: new CANNON.Vec3(0, this.bag.height * -0.5, 0),
		localAnchorB: new CANNON.Vec3(0, this.base.height * 0.5, 0),
	});
}

/**
 * Update the punching bag and its components
 * @method update
 */
Bag.prototype.update = function() {
  this.spring.applyForce();

  this.base.update();
  this.bag.update();
}