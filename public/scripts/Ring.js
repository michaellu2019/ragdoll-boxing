/**
 * Game object class to update and render the boxing ring
 */ 

/**
 * boxing ring game object
 * @class Ring
 * @constructor
 * @param {Number} x, x position of the boxing ring floor
 * @param {Number} y, y position of the boxing ring floor
 * @param {Number} z, z position of the boxing ring floor
 * @param {Number} width, width of the boxing ring floor
 * @param {Number} height, height of the boxing ring floor
 * @param {Number} depth, depth of the boxing ring floor
 * @param {Number} mass, mass of the boxing ring
 * @param {String} color, String representation of the boxing ring floor color
 */
function Ring(x, y, z, width, height, depth, mass, color) {
  this.floor = new Box(x, y, z, width, height, depth, mass, color);

  this.ropeOneTop = new Box(x - width * 0.5, y + height * 1.25, z, width * 0.01, width * 0.01, depth, mass, "#01579b");
  this.ropeOneMiddle = new Box(x - width * 0.5, y + height * 1.00, z, width * 0.01, width * 0.01, depth, mass, "#f44336");
  this.ropeOneBottom = new Box(x - width * 0.5, y + height * 0.75, z, width * 0.01, width * 0.01, depth, mass, "#01579b");

  this.ropeTwoTop = new Box(x + width * 0.5, y + height * 1.25, z, width * 0.01, width * 0.01, depth, mass, "#01579b");
  this.ropeTwoMiddle = new Box(x + width * 0.5, y + height * 1.00, z, width * 0.01, width * 0.01, depth, mass, "#f44336");
  this.ropeTwoBottom = new Box(x + width * 0.5, y + height * 0.75, z, width * 0.01, width * 0.01, depth, mass, "#01579b");

  this.ropeThreeTop = new Box(x, y + height * 1.25, z - depth * 0.5, width, width * 0.01, width * 0.01, mass, "#01579b");
  this.ropeThreeMiddle = new Box(x, y + height * 1.00, z - depth * 0.5, width, width * 0.01, width * 0.01, mass, "#f44336");
  this.ropeThreeBottom = new Box(x, y + height * 0.75, z - depth * 0.5, width, width * 0.01, width * 0.01, mass, "#01579b");

  this.ropeFourTop = new Box(x, y + height * 1.25, z + depth * 0.5, width, width * 0.01, width * 0.01, mass, "#01579b");
  this.ropeFourMiddle = new Box(x, y + height * 1.00, z + depth * 0.5, width, width * 0.01, width * 0.01, mass, "#f44336");
  this.ropeFourBottom = new Box(x, y + height * 0.75, z + depth * 0.5, width, width * 0.01, width * 0.01, mass, "#01579b");

  this.postOne = new Box(x - width * 0.475, y + height * 0.9, z - depth * 0.475, width * 0.05, height * 0.8, width * 0.05, mass, color);
  this.postTwo = new Box(x + width * 0.475, y + height * 0.9, z - depth * 0.475, width * 0.05, height * 0.8, width * 0.05, mass, color);
  this.postThree = new Box(x - width * 0.475, y + height * 0.9, z + depth * 0.475, width * 0.05, height * 0.8, width * 0.05, mass, color);
  this.postFour = new Box(x + width * 0.475, y + height * 0.9, z + depth * 0.475, width * 0.05, height * 0.8, width * 0.05, mass, color);
}

/**
 * Update the boxing ring and its components
 * @method update
 */
Ring.prototype.update = function() {
  this.floor.update();

  this.ropeOneTop.update();
  this.ropeOneMiddle.update();
  this.ropeOneBottom.update();

  this.ropeTwoTop.update();
  this.ropeTwoMiddle.update();
  this.ropeTwoBottom.update();

  this.ropeThreeTop.update();
  this.ropeThreeMiddle.update();
  this.ropeThreeBottom.update();

  this.ropeFourTop.update();
  this.ropeFourMiddle.update();
  this.ropeFourBottom.update();

  this.postOne.update();
  this.postTwo.update();
  this.postThree.update();
  this.postFour.update();
}