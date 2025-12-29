function goToMiniGame() {
  window.location.href = './games/mini/index.html';
}

function goToWordleGame() {
  window.location.href = './games/wordle/index.html';
}

function goToConnectionsGame() {
  window.location.href = './games/connections/index.html';
}

function goToStrandsGame() {
  window.location.href = './games/strands/index.html';
}

/* Add click functions to the main game cards */
if (document.getElementById('the-mini-card')) {
    document.getElementById('the-mini-card').addEventListener('click', goToMiniGame);
}
if (document.getElementById('wordle-card')) {
    document.getElementById('wordle-card').addEventListener('click', goToWordleGame);
}
if (document.getElementById('connections-card')) {
    document.getElementById('connections-card').addEventListener('click', goToConnectionsGame);
}
if (document.getElementById('strands-card')) {
    document.getElementById('strands-card').addEventListener('click', goToStrandsGame);
}