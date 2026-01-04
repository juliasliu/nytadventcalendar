function hideIntroPage() {
    document.getElementsByClassName('intro-screen-container')[0].style.display = "none";
}

function goBack() {
    window.history.back();
}

const Status = Object.freeze({
    ABSENT: 0,
    PRESENT: 1,
    CORRECT: 2,
});
const DICTIONARY_PATH = "../txt/dict.txt";
const WORDLE_PATH = "../txt/wordle.txt";
const NUM_LETTERS_IN_A_WORD = 5;
const NUM_ROWS = 6;
var dictionary = {};
/* Wordle solution */
var secretWord = "HOUSE";
/* Wordle game variables */
var tileIndex = 0;
var inputWord = "";
var numMistakesRemaining = NUM_ROWS;
var canType = true;
var canBackspace = false;
/* Wordle game state */
var submittedWords = [];
var gameWinState = false;
/* Wordle game streak and stats */
var numPlayed = 0;
var winPercentage = 0;
var winStreak = 0;
var winStreakMax = 0;
var pastWinDistribution = {};

function loadDictionary() {
    const response = fetch(DICTIONARY_PATH)
    .then(response => response.text())
    .then(data => {
        const itemsArray = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        dictionary = new Set(itemsArray);
        dictionary.add(secretWord);
        console.log("Loaded dictionary");
    });
}

function loadGameState() {
    numPlayed = Number(getCookie("wordle-num-played"));
    winPercentage = Number(getCookie("wordle-win-percentage"));
    winStreak = Number(getCookie("wordle-win-streak"));
    winStreakMax = Number(getCookie("wordle-win-streak-max"));
    pastWinDistribution = getCookie("wordle-win-distribution").split(',').map(item => Number(item));
}

function fillSubmittedWords() {
    submittedWords = getCookie("wordle-submitted-words").split(',');
    var index = 0;
    for (var word of submittedWords) {
        inputWord = word;
        for (var i = 0; i < word.length; i++) {
            document.getElementById(index).innerHTML = word[i];
            gradeTile(i, index);
            index++;
        }
    }
    tileIndex = index;
    inputWord = "";
    numMistakesRemaining = NUM_ROWS - Math.floor(tileIndex / 5);
}

function initWord() {
    loadDictionary();
    loadGameState();
    let day = Number(getCookie("day"));
    let date = getFullDate(new Date());
    document.getElementById('intro-day').innerHTML = day;
    document.getElementById('intro-date').innerHTML = date;
    let storedGameState = getCookie("wordle-game-state");
    let storedSubmittedWords = getCookie("wordle-submitted-words").split(',');
    if (storedSubmittedWords != "") {
        // If the game has been started or finished, fill in submitted words
        fillSubmittedWords();
    }
    if (storedGameState != "") {
        // If today's game has been finished, show the game results modal
        hideIntroPage();
        if (JSON.parse(storedGameState)) {
            setWinGameState();
        } else {
            setLoseGameState();
        }
    } else {
        // Read the wordle.txt file
        const response = fetch(WORDLE_PATH)
        .then(response => response.text())
        .then(data => {
            const itemsArray = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
            secretWord = itemsArray[day - 1];
        });
    }
}

function typeInputLetter(element) {
    if (element.srcElement.className == "key" && canType) {
        var inputLetter = element.srcElement.innerText;
        document.getElementById(tileIndex).innerHTML = inputLetter;
        document.getElementById(tileIndex).classList.add('focused');
        inputWord += inputLetter;
        tileIndex++;
        if (tileIndex % NUM_LETTERS_IN_A_WORD == 0) {
            canType = false;
        }
        canBackspace = true;
    }
}

function backspaceInputLetter() {
    if (tileIndex > 0 && canBackspace) {
        tileIndex--;
        document.getElementById(tileIndex).innerHTML = "";
        document.getElementById(tileIndex).classList.remove('focused');
        inputWord = inputWord.slice(0, -1);
        if (tileIndex == 0 || tileIndex % NUM_LETTERS_IN_A_WORD != 0) {
            canType = true;
        } else if (tileIndex % NUM_LETTERS_IN_A_WORD == 0) {
            canBackspace = false;
        }
    }
}

function gradeTile(letterIndex, tileIndex) {
    if (inputWord[letterIndex] == secretWord[letterIndex]) {
        document.getElementById(tileIndex).classList.add("correct");
        return Status.CORRECT;
    } else if (secretWord.includes(inputWord[letterIndex])) {
        document.getElementById(tileIndex).classList.add("present");
        return Status.PRESENT;
    } else {
        document.getElementById(tileIndex).classList.add("absent");
        return Status.ABSENT;
    }
}

function submitInputWord() {
    if (inputWord.length == NUM_LETTERS_IN_A_WORD && isWordValid()) {
        var matches = [];
        for (var i = 0; i < inputWord.length; i++) {
            var tileIndexToGrade = tileIndex - (NUM_LETTERS_IN_A_WORD - i);
            matches.push(gradeTile(i, tileIndexToGrade));
        }
        console.log(matches);
        submittedWords.push(inputWord);
        setCookie("wordle-submitted-words", submittedWords, NUM_EXPIRATION_DAYS);
        inputWord = "";
        numMistakesRemaining--;
        if (matches.every(item => item == Status.CORRECT)) {
            // YOU WIN
            setWinGameState(true);
        } else if (numMistakesRemaining == 0) {
            // Game over
            setLoseGameState(true);
        } else {
            canType = true;
        }
        canBackspace = false;
    }
}

function setWinGameState(updateGameStats) {
    gameWinState = true;
    if (updateGameStats) {
        var numWon = winPercentage * numPlayed;
        numPlayed++;
        winPercentage = (numWon + 1) / numPlayed * 100;
        winStreak++;
        winStreakMax = Math.max(winStreakMax, winStreak);
        pastWinDistribution[NUM_ROWS - numMistakesRemaining - 1]++;
        setCookie("wordle-game-state", gameWinState, NUM_EXPIRATION_DAYS);
        setCookie("wordle-num-played", numPlayed, NUM_EXPIRATION_DAYS);
        setCookie("wordle-win-percentage", winPercentage, NUM_EXPIRATION_DAYS);
        setCookie("wordle-win-streak", winStreak, NUM_EXPIRATION_DAYS);
        setCookie("wordle-win-streak-max", winStreakMax, NUM_EXPIRATION_DAYS);
        setCookie("wordle-win-distribution", pastWinDistribution, NUM_EXPIRATION_DAYS);
    }
    document.getElementById('keyboard').style.visibility = "hidden";
    document.getElementById('view-results-button').style.display = "inline";
    var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
    canType = false;
    console.log("You win!");
}

function setLoseGameState(updateGameStats) {
    if (updateGameStats) {
        var numWon = winPercentage * numPlayed;
        numPlayed++;
        winPercentage = (numWon) / numPlayed * 100;
        winStreak = 0;
        setCookie("wordle-game-state", gameWinState, NUM_EXPIRATION_DAYS);
        setCookie("wordle-num-played", numPlayed, NUM_EXPIRATION_DAYS);
        setCookie("wordle-win-percentage", winPercentage, NUM_EXPIRATION_DAYS);
        setCookie("wordle-win-streak", winStreak, NUM_EXPIRATION_DAYS);
    }
    document.getElementById('keyboard').style.visibility = "hidden";
    document.getElementById('view-results-button').style.display = "inline";
    var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
    canType = false;
    console.log("Game over");
}

function isWordValid() {
    var word = inputWord.toLowerCase();
    return dictionary.has(word);
}

function loadResults() {
    // Load title
    if (gameWinState) {
        document.getElementById('game-over').style.display = "none";
    } else {
        document.getElementById('congratulations').style.display = "none";
    }
    // Load game results stats
    document.getElementById('num-played').innerHTML = numPlayed;
    document.getElementById('win-percentage').innerHTML = winPercentage;
    document.getElementById('win-streak').innerHTML = winStreak;
    document.getElementById('win-streak-max').innerHTML = winStreakMax;
    // Load wordle distribution bar graph
    document.getElementById('1-guess').innerHTML = pastWinDistribution[0];
    document.getElementById('1-guess').style.width = "calc(" + Number(5 + pastWinDistribution[0] / numPlayed * 100) + "%)";
    document.getElementById('2-guess').innerHTML = pastWinDistribution[1];
    document.getElementById('2-guess').style.width = "calc(" + Number(5 + pastWinDistribution[1] / numPlayed * 100) + "%)";
    document.getElementById('3-guess').innerHTML = pastWinDistribution[2];
    document.getElementById('3-guess').style.width = "calc(" + Number(5 + pastWinDistribution[2] / numPlayed * 100) + "%)";
    document.getElementById('4-guess').innerHTML = pastWinDistribution[3];
    document.getElementById('4-guess').style.width = "calc(" + Number(5 + pastWinDistribution[3] / numPlayed * 100) + "%)";
    document.getElementById('5-guess').innerHTML = pastWinDistribution[4];
    document.getElementById('5-guess').style.width = "calc(" + Number(5 + pastWinDistribution[4] / numPlayed * 100) + "%)";
    document.getElementById('6-guess').innerHTML = pastWinDistribution[5];
    document.getElementById('6-guess').style.width = "calc(" + Number(5 + pastWinDistribution[5] / numPlayed * 100) + "%)";

    document.getElementById('back-to-home-button').addEventListener('click', goBack);
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
Array.from(document.getElementsByClassName('key')).forEach(function(e) {
    addEventListener('click', typeInputLetter);
});
document.getElementById('backspace-key').addEventListener('click', backspaceInputLetter);
document.getElementById('enter-key').addEventListener('click', submitInputWord);
document.getElementById('resultsModal').addEventListener('shown.bs.modal', loadResults);

initWord();