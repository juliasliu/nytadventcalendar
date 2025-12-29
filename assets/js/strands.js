function hideIntroPage() {
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
const RIDDLE = "Super Bowl halftime";
const THEME = "KENDRICKSET";
const SECRET_WORDS = [
    "KENDRICKSET", // 11
    "SQUABBLEUP", // 10
    "EUPHORIA", // 8
    "PEEKABOO", // 8
    "LUTHER", // 6
    "TVOFF", // 5
];
const SECRET_WORD_GRID = [
    ['K', 'E', 'R', 'I', 'S', 'E'],
    ['S', 'N', 'D', 'C', 'K', 'T'],
    ['Q', 'F', 'F', 'O', 'V', 'T'],
    ['P', 'U', 'E', 'U', 'E', 'U'],
    ['E', 'A', 'L', 'P', 'H', 'P'],
    ['E', 'B', 'B', 'H', 'E', 'O'],
    ['K', 'O', 'O', 'T', 'R', 'R'],
    ['A', 'B', 'L', 'U', 'A', 'I'],
]
var wordStatusGrid = [];
var selectedLetterIndices = [];
var wordSpelled = "";
var numWordsLeft = SECRET_WORDS.length;

function initWords() {
    // Check that the length of all the words fill the grid
    var totalLengthOfSecretWords = 0;
    for (var word of SECRET_WORDS) {
        totalLengthOfSecretWords += word.length;
    }
    console.assert(totalLengthOfSecretWords == NUM_TOTAL_LETTERS, 
        "Total length of words " + totalLengthOfSecretWords + " does not equal to " + NUM_TOTAL_LETTERS);
    // Proceed to fill all the letters in the grid
    wordStatusGrid = Array.from({ length: NUM_ROWS }, () => new Array(NUM_COLS).fill(Status.UNOCCUPIED));
    for (var i = 0; i < NUM_ROWS; i++) {
        for (var j = 0; j < NUM_COLS; j++) {
            var index = i * NUM_ROWS + j;
            var letterTileElement = document.createElement('div');
            letterTileElement.className = 'letter-tile';
            letterTileElement.id = index;
            letterTileElement.innerHTML = SECRET_WORD_GRID[i][j];
            letterTileElement.addEventListener('click', clickLetter);
            document.getElementsByClassName('word-search-grid')[0].appendChild(letterTileElement);
            wordStatusGrid[i][j] = Status.UNSELECTED;
        }
    }
    console.log(wordStatusGrid);
    document.getElementById('riddle').innerHTML = RIDDLE;
    document.getElementById('total-num-words').innerHTML = SECRET_WORDS.length;
    document.getElementById('num-words-found').innerHTML = SECRET_WORDS.length - numWordsLeft;
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
    letterButtonElement.innerHTML = letter;
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
    var isButton = false;
    if (element.srcElement.classList.contains("letter-tile-button")) {
        index = Number(element.srcElement.value);
        isButton = true;
    } else if (element.srcElement.classList.contains("letter-tile")
        || element.srcElement.classList.contains("letter-tile-selected")) {
        index = Number(element.srcElement.id);
    }
    if (index + 1) {
        var i = Math.floor(index / NUM_ROWS);
        var j = index % NUM_ROWS;
        var lastSelectedIndex = selectedLetterIndices.at(-1);
        var m = Math.floor(lastSelectedIndex / NUM_ROWS);
        var n = lastSelectedIndex % NUM_ROWS;
        var letter = element.srcElement.innerHTML;
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
            if (!m && !n || Math.abs(m - i) > 1 || Math.abs(n - j) > 1) {
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
    for (var secretWord of SECRET_WORDS) {
        if (wordSpelled == secretWord) {
            var isWordSpangram = wordSpelled == THEME;
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
            selectedLetterIndices = [];
            wordSpelled = "";
            numWordsLeft--;
            document.getElementById('num-words-found').innerHTML = SECRET_WORDS.length - numWordsLeft;
            document.getElementById('submit-button').disabled = true;
            isWordCorrect = true;
        }
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

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
document.getElementById('submit-button').addEventListener('click', submitWord);

initWords();