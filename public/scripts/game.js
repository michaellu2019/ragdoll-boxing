/**
 * Main game script to run and render the game
 */ 

// game loop animation function
(function () {
	var requestAnimationFrame = window.requestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();

// game configuration settings
const fps = 60;
let gameDuration = 60 * 1000;

// physics constants
const ZERO_VEC = new CANNON.Vec3(0, 0, 0);
const g = 10;
const gravity = new CANNON.Vec3(0, -g, 0);

const leftOrientation = -1;
const rightOrientation = 1;

const sizeScale = 0.8;
const massScale = 1;

// game objects
let moveSet;

let t = 0;
const cameraDistance = 5;
const cameraSpin = true;
let camera, scene, renderer;
let world;

let ring;
let playerOne, playerTwo;
let bag;

let mode = "COMBAT";
let running = false;
let gameStartTime;
let moveSetLength = 50;

// setup game
function init() {
	// configure game physics
	world = new CANNON.World();
	world.gravity.set(g * 0.0, g * 1.0, g * 0.0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 40;

	// configure game lighting
	scene = new THREE.Scene();

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
	directionalLight.position.set(10, 20, 0);
	scene.add(directionalLight);

	// initialize game objects
	ring = new Ring(0, sizeScale * -1, 0, sizeScale * 6, sizeScale * 2, sizeScale * 6, massScale * 0, "#e0e0e0");

	playerOne = new Player(false, 0, sizeScale * 1.15, sizeScale * 1.5, sizeScale * 0.4, sizeScale * 0.25, sizeScale * 1.5, 1, massScale * 50, "#29b6f6", "https://i.postimg.cc/VvxLZb7J/jface.png", 1);

	if (mode == "TRAINING") {
		bag = new Bag(0, sizeScale * 2.5, sizeScale * -1, sizeScale * 0.5, sizeScale * 2, massScale * 100, "#ef5350");
	} else {
		playerTwo = new Player(mode == "COMBAT", 0, sizeScale * 1.15, sizeScale * -1.5, sizeScale * 0.4, sizeScale * 0.25, sizeScale * 1.5, -1, massScale * 50, "#ef5350", "https://i.postimg.cc/wjdjhLyP/pface.png", -1);
		playerOne.setOpponent(playerTwo);
		playerTwo.setOpponent(playerOne);
	}	

	// create set of random punch moves for player to perform 
	let moves = [];
	moveSetLength = mode == "TRAINING" || mode == "COMPETE" ? 0 : 50;
	for (let i = 0; i < moveSetLength; i++) {
		moves.push(new Move(Math.floor(Math.random() * (moveLibrary.length - 1))));
	}
	moveSet = new MoveSet(moves);
	playerOne.addMoveSet(moveSet);

	// configure game camera
	const width = 10;
	const height = width * (window.innerHeight/window.innerWidth);
	camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 1, 100);

	camera.position.set(cameraDistance, cameraDistance, cameraDistance);
	camera.lookAt(0, 0, 0);
	
	// configure game renderer
	const gameWindowSize = 0.981;
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth * gameWindowSize, window.innerHeight * gameWindowSize);
	renderer.render(scene, camera);

	game.appendChild(renderer.domElement);

	// end the game session after the session time limit
	setTimeout(function() {
		endGame();
	}, gameDuration);

	running = true;
	gameStartTime = Date.now();
}

// update and render the game continuously at the specified FPS
function update() {
	world.step(1/fps);

	ring.update();

	playerOne.update();

	if (mode == "TRAINING") {
		bag.update();
	} else {
 		playerTwo.update();
	}
	
	moveSet.update();
	moveSet.render();

	// have the camera circle around the boxing ring
	if (cameraSpin) {
		t += Math.PI * 0.001;
		camera.position.set(cameraDistance * Math.sin(t), cameraDistance, cameraDistance * Math.cos(t));
		camera.lookAt(0, 0, 0);
	}
	renderer.render(scene, camera);
	
	// run the game at the specified FPS
	setTimeout(function() {
		if (running) {
			requestAnimationFrame(update);
		}
	}, 1000/fps);
}