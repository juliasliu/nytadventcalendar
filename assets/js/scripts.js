function goToWordleGame() {
  window.location.href = './games/wordle/index.html';
}

function goToConnectionsGame() {
  window.location.href = './games/connections/index.html';
}

/* Add click functions to the main game cards */
if (document.getElementById('wordle-card')) {
    document.getElementById('wordle-card').addEventListener('click', goToWordleGame);
}
if (document.getElementById('connections-card')) {
    document.getElementById('connections-card').addEventListener('click', goToConnectionsGame);
}