function hideIntroPage() {
    setCookie("date", new Date(), NUM_EXPIRATION_DAYS);
    document.getElementsByClassName('intro-screen-container')[0].style.display = "none";
}

function goBack() {
    window.history.back();
}

const Status = Object.freeze({
    UNOCCUPIED: 0,
    UNSELECTED: 1,
    SELECTED: 2,
    CORRECT: 3,
});
const Path = Object.freeze({
    IN_PROGRESS: '#dbd8c5',
    CORRECT: '#aedfee',
    SPANGRAM: '#f8cd05',
});
const GRID_SIZE = {
    'width': 324,
    'height': 422,
};
const STRANDS_DIR_PATH = "../txt/strands/";
const BUBBLE_SIZE = 44;
const SVG_NS = 'http://www.w3.org/2000/svg';
const MIN_WORD_LENGTH = 4;
const NUM_TOTAL_LETTERS = 48;
const NUM_ROWS = 8;
const NUM_COLS = 6;
const BUBBLE_MARGIN_H = (GRID_SIZE['width'] - NUM_COLS * BUBBLE_SIZE) / (NUM_COLS - 1);
const BUBBLE_MARGIN_V = (GRID_SIZE['height'] - NUM_ROWS * BUBBLE_SIZE) / (NUM_ROWS - 1);
const SPANGRAM_MESSAGE = "SPANGRAM!";
const TOO_SHORT_MESSAGE = "Too short";
const NOT_IN_WORD_LIST_MESSAGE = "Not in word list";
/* Strands solution */
var riddle = "Super Bowl halftime";
var theme = "KENDRICKSET";
var secretWords = [
    "KENDRICKSET", // 11
    "SQUABBLEUP", // 10
    "EUPHORIA", // 8
    "PEEKABOO", // 8
    "LUTHER", // 6
    "TVOFF", // 5
];
var secretWordGrid = [
    ['K', 'E', 'R', 'I', 'S', 'E'],
    ['S', 'N', 'D', 'C', 'K', 'T'],
    ['Q', 'F', 'F', 'O', 'V', 'T'],
    ['P', 'U', 'E', 'U', 'E', 'U'],
    ['E', 'A', 'L', 'P', 'H', 'P'],
    ['E', 'B', 'B', 'H', 'E', 'O'],
    ['K', 'O', 'O', 'T', 'R', 'R'],
    ['A', 'B', 'L', 'U', 'A', 'I'],
]
/* Strands game variables */
var wordStatusGrid = [];
var selectedLetterIndices = [];
var wordSpelled = "";
var numWordsLeft = secretWords.length;
/* Strands game state */
// The index is a value from 0 to NUM_ROWS * NUM_COLS
var submittedIndices = [];
// The word index corresponds to the order of the word in secretWords
var submittedWordIndices = [];
/* Strands game streak and stats */
var numPlayed = 0;
var winPercentage = 0;
var winStreak = 0;
var winStreakMax = 0;

function loadGameState() {
    numPlayed = Number(getCookie("strands-num-played"));
    winPercentage = Number(getCookie("strands-win-percentage"));
    winStreak = Number(getCookie("strands-win-streak"));
    winStreakMax = Number(getCookie("strands-win-streak-max"));
}

function fillSubmittedWords() {
    let submittedIndicesList = getCookie("strands-submitted-indices").split(',').map(item => Number(item));
    var startIndex = 0;
    for (var wordIndex of submittedWordIndices) {
        for (var j = 0; j < secretWords[wordIndex].length; j++) {
            var index = submittedIndicesList[startIndex + j];
            clickLetter(index);
        }
        startIndex += secretWords[wordIndex].length;
        submitWord();
        deselectAll();
    }
}

function initWords() {
    loadGameState();
    // Read the strands file for the current day
    let day = Number(getCookie("day"));
    let date = getFullDate(new Date());
    document.getElementById('intro-day').innerHTML = day;
    document.getElementById('intro-date').innerHTML = date;
    let strandsFilePath = STRANDS_DIR_PATH + day + ".txt";
    const response = fetch(strandsFilePath)
    .then(response => response.text())
    .then(data => {
        const itemsArray = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        riddle = itemsArray[0];
        secretWords = itemsArray[1].split(',');
        numWordsLeft = secretWords.length
        theme = secretWords[0];
        for (var i = 0; i < NUM_ROWS; i++) {
            var currentRowLetters = itemsArray[2 + i].split('');
            for (var j = 0; j < currentRowLetters.length; j++) {
                secretWordGrid[i][j] = currentRowLetters[j];
            }
        }
        // Proceed to fill all the letters in the grid
        wordStatusGrid = Array.from({ length: NUM_ROWS }, () => new Array(NUM_COLS).fill(Status.UNOCCUPIED));
        for (var i = 0; i < NUM_ROWS; i++) {
            for (var j = 0; j < NUM_COLS; j++) {
                var index = i * NUM_ROWS + j;
                var letterTileElement = document.createElement('div');
                letterTileElement.className = 'letter-tile';
                letterTileElement.id = index;
                letterTileElement.innerHTML = secretWordGrid[i][j];
                letterTileElement.addEventListener('click', clickLetter);
                document.getElementsByClassName('word-search-grid')[0].appendChild(letterTileElement);
                wordStatusGrid[i][j] = Status.UNSELECTED;
            }
        }
        console.log(wordStatusGrid);
        document.getElementById('riddle').innerHTML = riddle;
        document.getElementById('total-num-words').innerHTML = secretWords.length;
        document.getElementById('num-words-found').innerHTML = secretWords.length - numWordsLeft;

        submittedWordIndices = getCookie("strands-submitted-word-indices").split(',').filter(item => item.length > 0).map(item => Number(item));
        if (submittedWordIndices.length) {
            // If the game has been started or finished, draw submitted words
            fillSubmittedWords();
            if (submittedWordIndices.length == secretWords.length) {
                // If today's game has been finished, show the game results modal
                hideIntroPage();
            }
        }
    });
}

function selectLetter(index, letter) {
    var letterTileElement = document.getElementById(index);
    letterTileElement.className = 'letter-tile-selected';
    letterTileElement.innerHTML = '';
    var letterButtonElement = document.createElement('button');
    letterButtonElement.className = 'letter-tile-button';
    letterButtonElement.type = 'button';
    letterButtonElement.id = 'button-' + index;
    letterButtonElement.value = index;
    if (letter) letterButtonElement.innerHTML = letter;
    letterTileElement.append(letterButtonElement);
}

function deselectLetter(index, letter) {
    var letterTileElement = document.getElementById(index);
    letterTileElement.className = 'letter-tile';
    letterTileElement.innerHTML = letter;
}

function deselectAll() {
    for (var index of selectedLetterIndices) {
        var i = Math.floor(index / NUM_ROWS);
        var j = index % NUM_ROWS;
        var letter = document.getElementById('button-' + index).innerHTML;
        deselectLetter(index, letter);
        wordStatusGrid[i][j] = Status.UNSELECTED;
    }
    selectedLetterIndices = [];
    wordSpelled = "";
    document.getElementById('submit-button').disabled = true;
}

function drawWordStroke(pathType) {
    if (pathType == Path.CORRECT || pathType == Path.SPANGRAM) {
        var existingPathElement = document.getElementById('in-progress').firstChild;
        var pathElement = document.createElementNS(SVG_NS, 'path');
        pathElement.setAttribute('stroke', pathType);
        pathElement.setAttribute('d', existingPathElement.getAttribute('d'));
        document.getElementById('solved').append(pathElement);
        existingPathElement.remove();
    } else {
        var pathD = "";
        for (var k = 0; k < selectedLetterIndices.length; k++) {
            if (k == 0) {
                pathD += "M ";
            } else {
                pathD += "L ";
            }
            var i = BUBBLE_SIZE / 2 + Math.floor(selectedLetterIndices[k] / NUM_ROWS) * (BUBBLE_SIZE + BUBBLE_MARGIN_V);
            var j = BUBBLE_SIZE / 2 + selectedLetterIndices[k] % NUM_ROWS * (BUBBLE_SIZE + BUBBLE_MARGIN_H);
            pathD += j + " " + i;
        }
        if (pathD) {
            var pathElement = '<path d="' + pathD + '"></path>';
            document.getElementById('in-progress').innerHTML = pathElement;
        } else {
            document.getElementById('in-progress').firstChild.remove();
        }
    }
}

function clickLetter(element) {
    var index = -1;
    var letter = '';
    var isButton = false;
    if (element.srcElement) {
        letter = element.srcElement.innerHTML;
        if (element.srcElement.classList.contains("letter-tile-button")) {
            index = Number(element.srcElement.value);
            isButton = true;
        } else if (element.srcElement.classList.contains("letter-tile")
            || element.srcElement.classList.contains("letter-tile-selected")) {
            index = Number(element.srcElement.id);
        }
    } else {
        // Pseudo-clicking the letters if board has already been started
        index = Number(element);
        letter = document.getElementById(index).innerHTML;
    }
    if (index + 1) {
        var i = Math.floor(index / NUM_ROWS);
        var j = index % NUM_ROWS;
        var lastSelectedIndex = selectedLetterIndices.at(-1);
        var m = Math.floor(lastSelectedIndex / NUM_ROWS);
        var n = lastSelectedIndex % NUM_ROWS;
        if (wordStatusGrid[i][j] == Status.SELECTED && m == i && n == j) {
            // Can only deselect if the letter is the most recently selected letter
            if (!isButton) letter = element.srcElement.children[0].innerHTML;
            deselectLetter(index, letter);
            selectedLetterIndices.pop();
            wordStatusGrid[i][j] = Status.UNSELECTED;
            wordSpelled = wordSpelled.slice(0, -1);
            drawWordStroke();
            document.getElementById('word-spelled').innerHTML = wordSpelled;
        } else if (wordStatusGrid[i][j] == Status.UNSELECTED) {
            if (Math.abs(m - i) > 1 || Math.abs(n - j) > 1) {
                // Start new path if the letter is outside of 3x3 radius
                deselectAll();
            }
            selectLetter(index, letter);
            selectedLetterIndices.push(index);
            wordStatusGrid[i][j] = Status.SELECTED;
            wordSpelled += letter;
            drawWordStroke();
            document.getElementById('word-spelled').classList.remove('spangram');
            document.getElementById('word-spelled').classList.remove('correct');
            document.getElementById('word-spelled').innerHTML = wordSpelled;
        }
        if (wordSpelled.length < MIN_WORD_LENGTH) {
            document.getElementById('submit-button').disabled = true;
        } else {
            document.getElementById('submit-button').disabled = false;   
        }
    }
}

function submitWord() {
    var isWordCorrect = false;
    for (var secretWord of secretWords) {
        if (wordSpelled == secretWord) {
            var isWordSpangram = wordSpelled == theme;
            for (var index of selectedLetterIndices) {
                var i = Math.floor(index / NUM_ROWS);
                var j = index % NUM_ROWS;
                wordStatusGrid[i][j] = Status.CORRECT;
                if (isWordSpangram) {
                    document.getElementById('button-' + index).classList.add('spangram');
                } else {
                    document.getElementById('button-' + index).classList.add('correct');
                }
            }
            if (isWordSpangram) {
                document.getElementById('word-spelled').classList.add('spangram');
                document.getElementById('word-spelled').innerHTML = SPANGRAM_MESSAGE;
                drawWordStroke(Path.SPANGRAM);
            } else {
                document.getElementById('word-spelled').classList.add('correct');
                drawWordStroke(Path.CORRECT);
            }
            submittedIndices.push(...selectedLetterIndices);
            var wordIndex = secretWords.indexOf(wordSpelled);
            if (!submittedWordIndices.includes(wordIndex)) submittedWordIndices.push(wordIndex);
            setCookie("strands-submitted-indices", submittedIndices, NUM_EXPIRATION_DAYS);
            setCookie("strands-submitted-word-indices", submittedWordIndices, NUM_EXPIRATION_DAYS);
            selectedLetterIndices = [];
            wordSpelled = "";
            numWordsLeft--;
            document.getElementById('num-words-found').innerHTML = secretWords.length - numWordsLeft;
            document.getElementById('submit-button').disabled = true;
            isWordCorrect = true;
        }
    }
    if (numWordsLeft == 0) {
        // YOU WIN
        setWinGameState();
    }
    if (!isWordCorrect) {
        if (wordSpelled.length < MIN_WORD_LENGTH) {
            document.getElementById('word-spelled').innerHTML = TOO_SHORT_MESSAGE;
        } else {
            document.getElementById('word-spelled').innerHTML = NOT_IN_WORD_LIST_MESSAGE;
        }
        // Deselect all
        deselectAll();
        drawWordStroke();
    }
}

function setWinGameState() {
    let storedGameState = getCookie("connections-game-state");
    if (storedGameState == "") {
        // If the game was not finished previously today, update the game stats
        var numWon = winPercentage * numPlayed;
        numPlayed++;
        winPercentage = (numWon + 1) / numPlayed * 100;
        winStreak++;
        winStreakMax = Math.max(winStreakMax, winStreak);
    }
    setCookie("strands-game-state", true, NUM_EXPIRATION_DAYS);
    setCookie("strands-num-played", numPlayed, NUM_EXPIRATION_DAYS);
    setCookie("strands-win-percentage", winPercentage, NUM_EXPIRATION_DAYS);
    setCookie("strands-win-streak", winStreak, NUM_EXPIRATION_DAYS);
    setCookie("strands-win-streak-max", winStreakMax, NUM_EXPIRATION_DAYS);
    document.getElementById('progress-box').style.visibility = "hidden";
    document.getElementById('view-results-button').style.display = "inline";
    var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
    console.log("You win!");
}

function loadResults() {
    // Load title
    document.getElementById('game-over').style.display = "none";
    // Load game results stats
    document.getElementById('num-played').innerHTML = numPlayed;
    document.getElementById('win-percentage').innerHTML = winPercentage;
    document.getElementById('win-streak').innerHTML = winStreak;
    document.getElementById('win-streak-max').innerHTML = winStreakMax;
    // Load strands history bubbles
    document.getElementById('strands-history').innerHTML = "";
    for (var i = 0; i < submittedWordIndices.length; i++) {
        var strandHistoryBubbleElement = document.createElement('div');
        if (submittedWordIndices[i] == 0) strandHistoryBubbleElement.classList.add('spangram');
        document.getElementById('strands-history').append(strandHistoryBubbleElement);
    }

    document.getElementById('back-to-home-button').addEventListener('click', goBack);
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
document.getElementById('submit-button').addEventListener('click', submitWord);
document.getElementById('resultsModal').addEventListener('shown.bs.modal', loadResults);

initWords();