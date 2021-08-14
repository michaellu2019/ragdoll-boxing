/**
 * Game object class to update and render a Sphere shape
 */ 

/**
 * punching bag game object
 * @class Box
 * @constructor
 * @param {Number} x, x position of the box
 * @param {Number} y, y position of the box
 * @param {Number} z, z position of the box
 * @param {Number} width, width of the box
 * @param {Number} height, height of the box
 * @param {Number} depth, depth of the box
 * @param {Number} mass, mass of the box
 * @param {String} color, String representation of the box color
 * @param {String} image, String for the image source/path to render
 * @param {Number} imageFace, 0th <= imageFace <= 5th face of the box on which the image will be rendered 
 */
function Sphere(x, y, z, radius, mass, color, image = null, imageFace = null) {
  this.restPosition = new CANNON.Vec3(x, y, z);
  this.rotation = new CANNON.Vec3(0, 0, 0);
	this.radius = radius;
	this.color = color;

	const geometry = new THREE.SphereGeometry(this.radius);
	const threeColor = new THREE.Color(this.color);
	const loader = new THREE.TextureLoader();
	let material;
	if (image == null || imageFace == null) {
		material = new THREE.MeshPhongMaterial({ color: threeColor, opacity: 0.7, transparent: false });
	} else {
		// material = new THREE.MeshBasicMaterial({ map: loader.load(image), overdraw: 0.1 });
		material = new THREE.MeshPhongMaterial({ color: threeColor, opacity: 0.7, transparent: false });
	}
	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position.set(x, y, z);
	this.mesh.rotation.set(0, 0, 0);
	scene.add(this.mesh);

	const shape = new CANNON.Sphere(this.radius);
	this.mass = mass;
	this.body = new CANNON.Body({ mass: this.mass, shape: shape });
	this.body.position.set(x, y, z);
	this.body.quaternion.setFromEuler(0, Math.PI/2 * imageFace, 0, "XYZ");
	world.addBody(this.body);
}

Sphere.prototype.rotate = function(rx, ry, rz) {
	this.rotation.x = rx;
	this.rotation.y = ry;
	this.rotation.z = rz;
};

Sphere.prototype.update = function() {
	this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
	this.mesh.position.copy(this.body.position);
	this.mesh.quaternion.copy(this.body.quaternion);
}