/**
 * Script to handle HTTP requests between the webpage and the web server, mainly to save 
 * player scores and retrieve players' scores for the game leaderboard
 */ 

const url = "http://608dev-2.net/sandbox/sc/team13/final_project/justBox.py";

// send a GET request to retrieve all scores from all players and display 
// the 5 highest scores for the credits screen leaderboard
function getLeaderboard() {
  const requestOptions = {
    method: "GET",
    mode: "cors",
  };

  fetch(url, requestOptions).then(response => response.text()).then(response => {
    const leaderboardData = response.split(": ")[1].split(",");

    const leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "";
    leaderboardData.forEach((userString, i) => {
      const userData = userString.split("-");
      if (userData.length >= 2 && i < 5) {
        const userListItem = document.createElement("div");
        userListItem.innerHTML = (i + 1) + ". " + userData[0] + ": " + userData[1]
        leaderboard.appendChild(userListItem);
      }
    });
  });
}

// send a POST request to save the player's score from the most recent
// game session
function postScore(username, score) {
  const data = new URLSearchParams();
  data.append("user", username);
  data.append("score", score);

  const requestOptions = {
    method: "POST",
    mode: "cors",
    body: data,
  };

  fetch(url, requestOptions).then(response => response.text()).then(response => {
    getLeaderboard();
  });
}