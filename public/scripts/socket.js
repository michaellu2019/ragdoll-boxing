/**
 * Websocket client script that forwards punch classification, acceleration data, and correlation scoring bonuses 
 * received from the python websockets server to the game webpage
 */ 

// websocket configuration information
const hostIP = "SOMEONE'S IP ADDRESS";
const port = 3000;
// let sock = new WebSocket(`ws://${hostIP}:${port}`);

// websocket message signatures
const connectionMsg = "web-client";
const scoreMsg = "CSCORE,";
const dataMsg = "IMU";

// data values
let accs = [[0, 0, 0], [0, 0, 0]];
let punches = ["NONE", "NONE"];
let accAvgs = [[0, 0, 0], [0, 0, 0]];
let vals = [];

/* Removed without websockets and ESP8266 microcontroller support:

// websocket connection event
sock.onopen = function(event) {
  setTimeout(function() {
    sock.send(connectionMsg);
  }, 1000);
};

// websocket data received event
sock.onmessage = function(event) {
  if (event.data == connectionMsg) {
    return;
  }

  if (event.data.includes(scoreMsg)) {
    // if data received is for a correlation score bonus, add it to the player's points
    const score = parseInt(event.data.split(",")[1]);
    if (mode == "COMBAT" && playerOne.moveSet != null) {
      playerOne.moveSet.points += score;
    }
  } else if (event.data.includes(dataMsg)) {
    // if data received is for a punch classification/acceleration data, have the appropriate 
    // player perform the received punch moves
    data = event.data.split(",");
    let id = data[0];
    accs[0] = [parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3])];
    accs[1] = [parseFloat(data[4]), parseFloat(data[5]), parseFloat(data[6])];
    punches = [data[7], data[8]];

    if (id == "IMU0") {
      playerOne.punch(punches, accs);
    } else if (id == "IMU1") {
      if (playerTwo != null) {
        playerTwo.punch(punches, accs);
      }
    }
  }
}
*/

// keyboard controls for debugging punches
document.onkeydown = function(e) {
  if (running) {
    accs = [[0, 0, 0], [0, 0, 0]];
    punches = ["NONE", "NONE"];

    if (e.keyCode == 65) {
      // A key pressed
      punches[0] = "LH";
    } else if (e.keyCode == 68) {
      // D key pressed
      punches[1] = "RH";
    } else if (e.keyCode == 81) {
      // Q key pressed
      punches[0] = "LP";
    } else if (e.keyCode == 69) {
      // E key pressed
      punches[1] = "RP";
    } else if (e.keyCode == 90) {
      // Z key pressed
      punches[0] = "LW";
    } else if (e.keyCode == 67) {
      // C key pressed
      punches[1] = "RW";
    } else if (e.keyCode == 32) {
      // Spacebar key pressed
      punches = ["LB", "RB"];
    }

    playerOne.punch(punches, accs);
  }
}

document.onkeyup = function(e) {
  if (running) {
    accs = [[0, 0, 0], [0, 0, 0]];
    punches = ["NONE", "NONE"];
    playerOne.punch(punches, accs);
  }
}