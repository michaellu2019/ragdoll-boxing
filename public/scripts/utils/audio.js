/**
 * Script to group and store all audio assets as playable JavaScript objects
 */ 

const titleMusic = new Audio("assets/theme.mp3");
titleMusic.loop = true;
const combatMusic = [new Audio("assets/battle1.mp3"), new Audio("assets/battle2.mp3")];
combatMusic.forEach(music => music.loop = true);
const trainingMusic = [new Audio("assets/training.mp3")];
trainingMusic.forEach(music => music.loop = true);
const creditsMusic = [new Audio("assets/credits.mp3")];
creditsMusic.forEach(music => music.loop = true);

const crowdNoise = new Audio("assets/ambient.mp3");
crowdNoise.loop = true;

const ding = new Audio("assets/ding.mp3");
const wrong = new Audio("assets/wrong.mp3");

const wooshSounds = [new Audio("assets/whoosh1.mp3"), new Audio("assets/whoosh2.mp3"), new Audio("assets/whoosh3.mp3"), new Audio("assets/whoosh4.mp3")];
const punchSounds = [new Audio("assets/punch1.mp3"), new Audio("assets/punch2.mp3"), new Audio("assets/punch3.mp3"), new Audio("assets/punch4.mp3"), new Audio("assets/punch5.mp3")];

function playRandom(sounds) {
  const music = sounds[Math.floor(Math.random() * sounds.length)];
  music.play();
  return music;
}