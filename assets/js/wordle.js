function hideIntroPage() {
    document.getElementsByClassName('intro-screen-container')[0].style.display = "none";
}

const SECRET_WORD = "WATER";
var tileIndex = 0;
var inputWord = "";
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

function doesInputMatchSecretWord() {
    /**
     * 0 means the letter is not found in the secret word
     * 1 means the letter is found in the secret word but in the incorrect position
     * 2 means the letter is found in the secret word and in the correct position
     */
    var inputMatchArray = [];
    for (var i = 0; i < inputWord.length; i++) {
        if (inputWord[i] == SECRET_WORD[i]) {
            inputMatchArray[i] = 2;
        } else if (SECRET_WORD.includes(inputWord[i])) {
            inputMatchArray[i] = 1;
        } else {
            inputMatchArray[i] = 0;
        }
    }
    return inputMatchArray;
}

function submitInputWord() {
    if (inputWord.length == 5) {
        var matches = doesInputMatchSecretWord();
        console.log(matches);
        /**
         * Mark the tiles based on the letter match number
         * 0: absent
         * 1: present
         * 2: correct
         */
        for (var i = 0; i < inputWord.length; i++) {
            var tileIndexToGrade = tileIndex - (5 - i);
            if (matches[i] == 0) {
                document.getElementById(tileIndexToGrade).classList.add("absent");
            } else if (matches[i] == 1) {
                document.getElementById(tileIndexToGrade).classList.add("present");
            } else if (matches[i] == 2) {
                document.getElementById(tileIndexToGrade).classList.add("correct");
            }
        }
        inputWord = "";
        canType = true;
        canBackspace = false;
    }
}

document.getElementById('play-button').addEventListener('click', hideIntroPage);
Array.from(document.getElementsByClassName('key')).forEach(function(e) {
    addEventListener('click', typeInputLetter);
});
document.getElementById('backspace-key').addEventListener('click', backspaceInputLetter);
document.getElementById('enter-key').addEventListener('click', submitInputWord);