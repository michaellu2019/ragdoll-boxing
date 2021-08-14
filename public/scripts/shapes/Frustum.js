/**
 * Game object class to update and render a frustum shape
 */ 

/**
 * frustum object
 * @class Frustum
 * @constructor
 * @param {Number} x, x position of the frustum
 * @param {Number} y, y position of the frustum
 * @param {Number} z, z position of the frustum
 * @param {Number} radiusTop, top radius of the frustum
 * @param {Number} radiusBottom, bottom radius of the frustum
 * @param {Number} height, height of the frustum
 * @param {Number} mass, mass of the frustum
 * @param {String} color, String representation of the frustum color
 * @param {String} image, String for the image source/path to render
 * @param {Number} imageFace, 0th <= imageFace <= 5th face of the box on which the image will be rendered 
 */
function Frustum(x, y, z, radiusTop, radiusBottom, height, mass, color) {
  this.restPosition = new CANNON.Vec3(x, y, z);
  this.rotation = new CANNON.Vec3(0, 0, 0);
	this.radiusTop = radiusTop;
	this.radiusBottom = radiusBottom;
	this.height = height;
	this.color = color;

	// create objects for Three.js rendering
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 10, 1, false);
	const threeColor = new THREE.Color(this.color);
	const material = new THREE.MeshPhongMaterial({ color: threeColor, opacity: 0.7, transparent: false });
	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position.set(x, y, z);
	this.mesh.rotation.set(0, 0, 0);
	scene.add(this.mesh);

	// create objects for Cannon.js physics
	const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, 10);
	this.mass = mass;
	this.body = new CANNON.Body({ mass: this.mass, shape: shape });
	this.body.position.set(x, y, z);
	world.addBody(this.body);
}

/**
 * Update the frustum and its component
 * @method update
 */
Frustum.prototype.update = function() {
	this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
	this.mesh.position.copy(this.body.position);
	this.mesh.quaternion.copy(this.body.quaternion);
}