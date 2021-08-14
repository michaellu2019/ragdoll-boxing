/**
 * Game object class to update and render the player's set of punching moves
 */ 

// contains all the legal punch moves, their ID, display name, and point value
const moveLibrary = [
	{ id: "LP", name: "LEFT PUNCH", points: 5 }, 
	{ id: "RP", name: "RIGHT PUNCH", points: 5 },
	{ id: "LH", name: "LEFT HOOK", points: 10 },
	{ id: "RH", name: "RIGHT HOOK", points: 10 },
	{ id: "LW", name: "LEFT WEAVE", points: 7 },
	{ id: "RW", name: "RIGHT WEAVE", points: 7 }, 
	{ id: "LB", name: "LEFT BLOCK", points: 3 },
	{ id: "RB", name: "RIGHT BLOCK", points: 3 },
	{ id: "NONE", name: "NONE", points: 0 }
];

// maps all legal punch moves (by ID) to a counter punch move (for the computer opponent)
const counterMoveLibrary = {
	"LP": { id: "RW", name: "RIGHT WEAVE", points: 7 },
	"RP": { id: "LW", name: "LEFT WEAVE", points: 7 }, 
	"LH": { id: "LW", name: "LEFT WEAVE", points: 7 }, 
	"RH": { id: "RW", name: "RIGHT WEAVE", points: 7 },
	"LW": { id: "RH", name: "RIGHT HOOK", points: 10 },
	"RW": { id: "LH", name: "LEFT HOOK", points: 10 },
	"LB": { id: "RP", name: "RIGHT PUNCH", points: 5 },
	"RB": { id: "LP", name: "LEFT PUNCH", points: 5 }, 
	"NONE": { id: "LP", name: "LEFT PUNCH", points: 5 }, 
};

/**
 * punch move game object
 * @class Move
 * @constructor
 * @param {Number} index, index of the move in its moveset
 */
function Move(index) {
	this.index = index;
	this.id = moveLibrary[index].id;
	this.name = moveLibrary[index].name;
	this.points = moveLibrary[index].points;
}

/**
 * punch move set game object
 * @class MoveSet
 * @constructor
 * @param {Array} moves, array of Move objects of which the punch move set is comprised 
 */
function MoveSet(moves) {
	this.moves = moves;
	this.leftPunch = moveLibrary[moveLibrary.length - 1];
	this.rightPunch = moveLibrary[moveLibrary.length - 1];
	this.points = 0;
	this.hit = 0;
	this.missed = 0;
	this.index = 0;
	this.player = null;

	// the current assigned punch move is displayed in different colors based on how much
	// time the user has to perform them
	this.nextPunchColor = "#29b6f6";
	this.nextPunchWarningColor = "#ffeb3b";
	this.nextPunchWrongColor = "#ef5350";

	// fields to control how long it takes for a punch move to be queued up and 
	// how long a punch move stays up
	this.moveDuration = 3500;
	this.advanceTime = Date.now();
	this.loadDuration = 1000;
	this.loadTime = Date.now();
	this.loadingPunch = false;

	// initialize HTML element to render the punch move set text
	this.html = document.createElement("div");
	this.html.style.color = "#ffffff";
	this.html.style.fontSize = "2rem";
	this.html.style.textAlign = "center";
	this.html.style.position = "absolute";
	this.html.style.top = "1rem";
	this.html.style.left = "1.2rem";
	this.html.style.width = "100%";
	this.html.innerHTML = "";

	this.nextPunchHTML = document.createElement("div");
	this.nextPunchHTML.style.color = this.nextPunchColor;
	this.nextPunchHTML.style.fontWeight = "700";
	this.html.appendChild(this.nextPunchHTML);

	this.currentPunchHTML = document.createElement("div");
	this.currentPunchHTML.style.color = "#ffffff";
	this.currentPunchHTML.style.fontSize = "1rem";
	this.html.appendChild(this.currentPunchHTML);

	this.pointsHTML = document.createElement("div");
	this.pointsHTML.style.color = "#ffffff";
	this.pointsHTML.style.position = "absolute";
	this.pointsHTML.style.top = "0.1rem";
	this.html.appendChild(this.pointsHTML);

	this.timeHTML = document.createElement("div");
	this.timeHTML.style.color = "#ffffff";
	this.timeHTML.style.position = "absolute";
	this.timeHTML.style.top = "2rem";
	this.html.appendChild(this.timeHTML);

	game.appendChild(this.html);

	// send the first punch move in the punch move set to the websockets server
	// to initialize the correlation scoring bonus 
	if (this.moves.length > 0 && sock.connected) {
		const socketData = "PUNCH_MISS," + this.moves[this.index].id;
		sock.send(socketData);
	}
}


/**
 * Update the points, and indices of the punch move set based on the player's most recently performed punch moves
 * @method advance
 * @param {Array} punches, the left and right punch moves the player just performed
 */
MoveSet.prototype.advance = function(punches) {
	if (this.loadingPunch)
		return;

	if (punches[0] == "MISS" || punches[1] == "MISS") {
		// if the player missed the assigned punch move, deduct points and load a new move
		const currentMove = this.moves[this.index];

		this.points -= currentMove.points;
		this.nextPunchHTML.style.color = this.nextPunchColor;
		wrong.currentTime = 0;
		wrong.play();
		this.missed++;
		this.loadTime = Date.now();
		this.loadingPunch = true;

		// notify the websocket server that a punch move was missed and send the next queued punch move
		const socketData = "PUNCH_MISS," + this.moves[(this.index + 1) % this.moves.length].id;
		sock.send(socketData);
		
		// have the player's opponent perform a punch move
		this.opponentPunch(currentMove);
		return;
	} 
	
	let leftPunchId = punches[0];
	this.leftPunch = moveLibrary.find(move => move.id == leftPunchId);
	let rightPunchId = punches[1];
	this.rightPunch = moveLibrary.find(move => move.id == rightPunchId);

	this.leftPunch = this.leftPunch == undefined ? moveLibrary[moveLibrary.length - 1] : this.leftPunch;
	this.rightPunch = this.leftPunch == undefined ? moveLibrary[moveLibrary.length - 1] : this.rightPunch;

	if (this.moves.length < 1)
		return;
		
	const currentMove = this.moves[this.index];
	if (currentMove.id == leftPunchId || currentMove.id == rightPunchId) {
		// if the player completed the assigned punch move, add points and load a new move
		this.points += currentMove.points;
		this.nextPunchHTML.style.color = this.nextPunchColor;
		ding.currentTime = 0;
		ding.play();
		this.hit++;
		this.loadTime = Date.now();
		this.loadingPunch = true;

		// notify the websocket server that a punch move was completed and send the next queued punch move
		const socketData = "PUNCH_MADE," + this.moves[(this.index + 1) % this.moves.length].id;
		sock.send(socketData);
		
		// have the player's opponent perform a punch only if the player was blocking or weaving
		if (currentMove.id.charAt(1) == "B" || currentMove.id.charAt(1) == "W") {
			this.opponentPunch(currentMove);
		}
	}
}

/**
 * Have the opponent computer player perform an opposing punch move at a random speed
 * @method update
 * @param {Move} currentMove, the move the player is performing
 */
MoveSet.prototype.opponentPunch = function(currentMove) {
	if (this.player != null && this.player.opponent != null) {
		let opponentPunches = ["NONE", "NONE"];
		const opponentPunchMove = counterMoveLibrary[currentMove.id].id;
		const opponentPunchSide = opponentPunchMove.charAt(0) == "L" ? 0 : 1;
		opponentPunches[opponentPunchSide] = opponentPunchMove;
		if (opponentPunches[0] == "LB" || opponentPunches[1] == "RB") {
			opponentPunches = ["LB", "RB"];
		}

		this.player.opponent.punch(opponentPunches, [[Math.random(), Math.random(), Math.random()], [Math.random(), Math.random(), Math.random()]]);
	}
}

/**
 * Update the punch move set
 * @method update
 */
MoveSet.prototype.update = function() {
	if (this.moves.length < 1)
		return;

	if (this.loadingPunch) {
		// if enough time has passed, stop loading and display the next assigned punch
		if (Date.now() - this.loadTime > this.loadDuration) {
			this.index = (this.index + 1) % this.moves.length;
			this.loadingPunch = false;
			this.advanceTime = Date.now();
		}
	} else {
		// change the color of the assigned punch move to indicate how much time is left to 
		// complete it
		if (Date.now() - this.advanceTime > this.moveDuration * (1/3)) {
			this.nextPunchHTML.style.color = this.nextPunchWarningColor;
		}

		if (Date.now() - this.advanceTime > this.moveDuration * (2/3)) {
			this.nextPunchHTML.style.color = this.nextPunchWrongColor;
		}

		// if over 3 seconds has passed, the player has missed the assigned punch move
		if (Date.now() - this.advanceTime > this.moveDuration) {
			this.advance(["MISS", "MISS"]);
		}
	}
}

/**
 * Render the punch move set text
 * @method update
 */
MoveSet.prototype.render = function() {
	this.leftPunch = this.leftPunch == undefined ? moveLibrary[moveLibrary.length - 1] : this.leftPunch;
	this.rightPunch = this.leftPunch == undefined ? moveLibrary[moveLibrary.length - 1] : this.rightPunch;

	if (mode == "COMBAT") {
		this.pointsHTML.innerHTML = "POINTS: " + this.points;
		this.nextPunchHTML.innerHTML = (this.moves.length > 0 ? (!this.loadingPunch ? this.moves[this.index].name : "<br>") : "No Moves Left");
	}
	
	this.currentPunchHTML.innerHTML = this.leftPunch.name + ", " + this.rightPunch.name;
	this.timeHTML.innerHTML = "TIME LEFT: " + (gameDuration/1000 - Math.round((Date.now() - gameStartTime)/1000));
}