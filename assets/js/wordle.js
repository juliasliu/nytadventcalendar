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
const SECRET_WORD = "WATER";
var pastSubmittedWords = [];
var tileIndex = 0;
var inputWord = "";
var numMistakesRemaining = 6;
var canType = true;
var canBackspace = true;

function typeInputLetter(element) {
    if (element.srcElement.className == "key" && canType) {
        var inputLetter = element.srcElement.innerText;
        document.getElementById(tileIndex).innerHTML = inputLetter;
        inputWord += inputLetter;
        tileIndex++;
        if (tileIndex % 5 == 0) {
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
        if (tileIndex == 0 || tileIndex % 5 != 0) {
            canType = true;
        } else if (tileIndex % 5 == 0) {
            canBackspace = false;
        }
    }
}

function submitInputWord() {
    if (inputWord.length == 5) {
        var matches = [];
        for (var i = 0; i < inputWord.length; i++) {
            var tileIndexToGrade = tileIndex - (5 - i);
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

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
Array.from(document.getElementsByClassName('key')).forEach(function(e) {
    addEventListener('click', typeInputLetter);
});
document.getElementById('backspace-key').addEventListener('click', backspaceInputLetter);
document.getElementById('enter-key').addEventListener('click', submitInputWord);