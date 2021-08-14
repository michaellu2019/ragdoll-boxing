/**
 * Game object class to update and render a Box shape
 */ 

/**
 * box game object
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
function Box(x, y, z, width, height, depth, mass, color, image = null, imageFace = null) {
  this.restPosition = new CANNON.Vec3(x, y, z);
  this.rotation = new CANNON.Vec3(0, 0, 0);
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.color = color;

	// create objects for Three.js rendering
	const geometry = new THREE.BoxGeometry(width, height, depth);
	const threeColor = new THREE.Color(this.color);
	const loader = new THREE.TextureLoader();
	const defaultMaterial = new THREE.MeshPhongMaterial({ color: threeColor, opacity: 0.7, transparent: false });
	let material;

	// if image and imageFace were passed in, render the image on the material
	if (image == null || imageFace == null) {
		material = defaultMaterial;
	} else {
		material = [defaultMaterial, defaultMaterial, defaultMaterial, defaultMaterial, defaultMaterial, defaultMaterial];
		material[imageFace] = new THREE.MeshBasicMaterial({ map: loader.load(image) });
	}
	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position.set(x, y, z);
	this.mesh.rotation.set(0, 0, 0);
	scene.add(this.mesh);

	// create objects for Cannon.js physics
	const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
	this.mass = mass;
	this.body = new CANNON.Body({ mass: this.mass, shape: shape });
	this.body.position.set(x, y, z);
	world.addBody(this.body);
}

/**
 * Update the box and its component
 * @method update
 */
Box.prototype.update = function() {
	this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
	this.mesh.position.copy(this.body.position);
	this.mesh.quaternion.copy(this.body.quaternion);
}