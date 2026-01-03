function hideIntroPage() {
    setCookie("date", new Date(), NUM_EXPIRATION_DAYS);
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
const NUM_LETTERS_IN_A_WORD = 5;
const NUM_ROWS = 6;
const SECRET_WORD = "HOUSE";
var dictionary = {};
var pastSubmittedWords = [];
var tileIndex = 0;
var inputWord = "";
var numMistakesRemaining = NUM_ROWS;
var canType = true;
var canBackspace = true;
var gameWinState = false;

function loadDictionary() {
    const response = fetch(DICTIONARY_PATH)
    .then(response => response.text())
    .then(data => {
        const itemsArray = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        dictionary = new Set(itemsArray);
        dictionary.add(SECRET_WORD);
        console.log("Loaded dictionary");
    });
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

function submitInputWord() {
    if (inputWord.length == NUM_LETTERS_IN_A_WORD && isWordValid()) {
        var matches = [];
        for (var i = 0; i < inputWord.length; i++) {
            var tileIndexToGrade = tileIndex - (NUM_LETTERS_IN_A_WORD - i);
            if (inputWord[i] == SECRET_WORD[i]) {
                matches[i] = Status.CORRECT;
                document.getElementById(tileIndexToGrade).classList.add("correct");
            } else if (SECRET_WORD.includes(inputWord[i])) {
                matches[i] = Status.PRESENT;
                document.getElementById(tileIndexToGrade).classList.add("present");
            } else {
                matches[i] = Status.ABSENT;
                document.getElementById(tileIndexToGrade).classList.add("absent");
            }
        }
        console.log(matches);
        pastSubmittedWords.push(matches);
        inputWord = "";
        numMistakesRemaining--;
        if (matches.every(item => item == Status.CORRECT)) {
            // YOU WIN
            document.getElementById('keyboard').style.visibility = "hidden";
            document.getElementById('view-results-button').style.display = "inline";
            var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
            resultsModal.show();
            canType = false;
            gameWinState = true;
            console.log("You win!");
        } else if (numMistakesRemaining == 0) {
            // Game over
            document.getElementById('keyboard').style.visibility = "hidden";
            document.getElementById('view-results-button').style.display = "inline";
            var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
            resultsModal.show();
            canType = false;
            console.log("Game over");
        } else {
            canType = true;
        }
        canBackspace = false;
    }
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
    // Load advent progress bar
    // Load game results stats
    // Load world distribution bar graph
    document.getElementById('back-to-home-button').addEventListener('click', goBack);
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
Array.from(document.getElementsByClassName('key')).forEach(function(e) {
    addEventListener('click', typeInputLetter);
});
document.getElementById('backspace-key').addEventListener('click', backspaceInputLetter);
document.getElementById('enter-key').addEventListener('click', submitInputWord);
document.getElementById('resultsModal').addEventListener('shown.bs.modal', loadResults)

loadDictionary();