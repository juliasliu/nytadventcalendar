function goToWordleGame() {
  window.location.href = './games/wordle/index.html';
}

function goBack() {
    window.history.back();
}

/* Add click functions to the main game cards */
if (document.getElementById('wordle-card')) {
    document.getElementById('wordle-card').addEventListener('click', goToWordleGame);
}

document.getElementById('back-button').addEventListener('click', goBack);