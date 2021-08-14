/**
 * JS DOM script to handle client interactions with the game webpage, i.e. button clicks to modify
 * the current game state and/or game mode
 */ 

// initialize all JS DOM objects
const startButton = document.getElementById("start-button");
const competeButton = document.getElementById("compete-button");
const playButton = document.getElementById("play-button");
const trainButton = document.getElementById("train-button");
const saveButton = document.getElementById("save-button");
const replayButton = document.getElementById("replay-button");

const usernameInput = document.getElementById("username-input");
const score = document.getElementById("score");

const loading = document.getElementById("loading");
const loadingBar = document.getElementById("loading-bar");

const title = document.getElementById("title");
title.style.display = "none";
const game = document.getElementById("game");
const credits = document.getElementById("credits");
const scoreForm = document.getElementById("score-form");
credits.style.display = "none";

let gameMusic, endMusic;

// begin loading screen animation
window.onload = function() {
	setTimeout(() => {
		startButton.style.visibility = "visible";
	}, 3000);
	setTimeout(() => {
		startButton.style.opacity = "1";
	}, 3000);
	getLeaderboard();
}

// handle webpage button clicks
startButton.onclick = function() {
	loading.style.display = "none";
	title.style.display = "flex";
	titleMusic.play();
}

playButton.onclick = function() {
	mode = "COMBAT";
	gameDuration = 60 * 1000;
  startGame();
}

competeButton.onclick = function() {
	mode = "COMPETE";
	gameDuration = 120 * 1000;
	startGame();
}

trainButton.onclick = function() {
	mode = "TRAINING";
	gameDuration = 180 * 1000;
	startGame();
}

replayButton.onclick = function() {
  loading.style.display = "none";
	title.style.display = "flex";
	titleMusic.currentTime = 0;
	titleMusic.play();
	credits.style.display = "none";
  if (endMusic) {
    endMusic.pause();
    endMusic.currentTime = 0;
  }
}

saveButton.onclick = function() {
	postScore(usernameInput.value, moveSet.points);
	saveButton.style.visibility = "hidden";
}

// configure game for a new game session
function startGame() {
	title.style.display = "none";
	credits.style.display = "none";
	game.style.display = "block";
	init();
	update();
	if (mode == "TRAINING") {
		gameMusic = playRandom(trainingMusic);
	} else {
		gameMusic = playRandom(combatMusic);
		crowdNoise.play();
	}
	titleMusic.pause();
	titleMusic.currentTime = 0;
  if (endMusic) {
    endMusic.pause();
    endMusic.currentTime = 0;
  }
}

// stop game session
function endGame() {
  running = false;
  score.innerHTML = "Score: " + moveSet.points + " (" + moveSet.hit + " Hit, " + moveSet.missed + " Missed)";
  game.removeChild(renderer.domElement);
  game.removeChild(moveSet.html);
  game.style.display = "none";
  credits.style.display = "block";
  saveButton.style.visibility = "visible";
	if (mode == "COMBAT") {
		scoreForm.style.display = "block";
	} else {
		scoreForm.style.display = "none";
	}
  gameMusic.pause();
  gameMusic.currentTime = 0;
	crowdNoise.pause();
	crowdNoise.currentTime = 0;
  endMusic = playRandom(creditsMusic);
}