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
const DICTIONARY_PATH = "../../assets/txt/dict.txt";
const NUM_LETTERS_IN_A_WORD = 5;
const NUM_ROWS = 6;
const SECRET_WORD = "WATER";
var dictionary = {};
var pastSubmittedWords = [];
var tileIndex = 0;
var inputWord = "";
var numMistakesRemaining = NUM_ROWS;
var canType = true;
var canBackspace = true;

function loadDictionary() {
    const response = fetch(DICTIONARY_PATH)
    .then(response => {
        if (!response.ok) {
            console.error("Could not load the dictionary", error);
        }
    })
    .then(data => {
        const itemsArray = data.split('\\n').map(item => item.trim()).filter(item => item.length > 0);
        dictionary = new Set(itemsArray);
        console.log("Loaded dictionary");
    });
}

function typeInputLetter(element) {
    if (element.srcElement.className == "key" && canType) {
        var inputLetter = element.srcElement.innerText;
        document.getElementById(tileIndex).innerHTML = inputLetter;
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
        if (numMistakesRemaining == 0) {
            // Game over
            console.log("Game over");
            canBackspace = false;
        } else {
            canType = true;
            canBackspace = false;
        }
    }
}

function isWordValid() {
    var word = inputWord.toLowerCase();
    word = word.replace(/^./, (char) => char.toUpperCase());
    return dictionary.has(word);
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
Array.from(document.getElementsByClassName('key')).forEach(function(e) {
    addEventListener('click', typeInputLetter);
});
document.getElementById('backspace-key').addEventListener('click', backspaceInputLetter);
document.getElementById('enter-key').addEventListener('click', submitInputWord);

loadDictionary();