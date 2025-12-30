function hideIntroPage() {
    document.getElementsByClassName('intro-screen-container')[0].style.display = "none";
    isGameInProgress = true;
    startStopwatch();
}

function goBack() {
    window.history.back();
}

const Status = Object.freeze({
    UNOCCUPIED: 0,
    UNFILLED: 1,
    INCORRECT: 2,
    CORRECT: 3,
});
const Direction = Object.freeze({
    ACROSS: 0,
    DOWN: 1,
});
const CELL_SIZE = 100;
const GRID_STROKE_WIDTH = 3;
const TILE_NUMBER_FONT_SIZE = 32;
const TILE_TEXT_FONT_SIZE = 64;
const SVG_NS = 'http://www.w3.org/2000/svg';
const NUM_ROWS = 5;
const NUM_COLS = 5;
// Words are ordered from sequential order (ACROSS consecutive then DOWN consecutive)
const SECRET_WORDS = [
    { hint: "___ Poehler", word: "Amy", startPosition: 2, direction: Direction.ACROSS },
    { hint: "Lil' Sebastian", word: "Horse", startPosition: 10, direction: Direction.ACROSS },
    { hint: "\"Skim ___ is just water lying about being ___\"", word: "Milk", startPosition: 20, direction: Direction.ACROSS },
    { hint: "Ron's assistant", word: "April", startPosition: 2, direction: Direction.DOWN },
    { hint: "An adlib repeated in a rap song", word: "Yeet", startPosition: 4, direction: Direction.DOWN },
    { hint: "Impulse", word: "Whim", startPosition: 5, direction: Direction.DOWN },
];
/** The number represents the number of the word, e.g. 1 to 7.
 *  -1: The space is blank.
 *   0: The space is not the first letter of the word.
 *  The acrossIndex and downIndex values correspond to the index of the word in SECRET_WORDS.
 *  -1: The space does not correspond to any word.
 */
/**
 *  - - A M Y
 *  W - P - E
 *  H O R S E
 *  I - I - T
 *  M I L K -
 */
const SECRET_CROSSWORD = [
    [
        { number: -1, acrossIndex: -1, downIndex: -1, letter: ''},
        { number: -1, acrossIndex: -1, downIndex: -1, letter: ''},
        { number: 1, acrossIndex: 0, downIndex: 3, letter: 'A'},
        { number: 0, acrossIndex: 0, downIndex: -1, letter: 'M'},
        { number: 2, acrossIndex: 0, downIndex: 4, letter: 'Y'},
    ],
    [
        { number: 3, acrossIndex: -1, downIndex: 5, letter: 'W'},
        { number: -1, acrossIndex: -1, downIndex: -1, letter: ''},
        { number: 0, acrossIndex: -1, downIndex: 3, letter: 'P'},
        { number: -1, acrossIndex: -1, downIndex: -1, letter: ''},
        { number: 0, acrossIndex: -1, downIndex: 4, letter: 'E'},
    ],
    [
        { number: 4, acrossIndex: 1, downIndex: 5, letter: 'H'},
        { number: 0, acrossIndex: 1, downIndex: -1, letter: 'O'},
        { number: 0, acrossIndex: 1, downIndex: 3, letter: 'R'},
        { number: 0, acrossIndex: 1, downIndex: -1, letter: 'S'},
        { number: 0, acrossIndex: 1, downIndex: 4, letter: 'E'},
    ],
    [
        { number: 0, acrossIndex: -1, downIndex: 5, letter: 'I'},
        { number: -1, acrossIndex: -1, downIndex: -1, letter: ''},
        { number: 0, acrossIndex: -1, downIndex: 3, letter: 'I'},
        { number: -1, acrossIndex: -1, downIndex: -1, letter: ''},
        { number: 0, acrossIndex: -1, downIndex: 4, letter: 'T'},
    ],
    [
        { number: 5, acrossIndex: 2, downIndex: 5, letter: 'M'},
        { number: 0, acrossIndex: 2, downIndex: -1, letter: 'I'},
        { number: 0, acrossIndex: 2, downIndex: 3, letter: 'L'},
        { number: 0, acrossIndex: 2, downIndex: -1, letter: 'K'},
        { number: -1, acrossIndex: -1, downIndex: -1, letter: ''},
    ],
]
var crosswordStatusGrid = [];
var currentIndex = NUM_ROWS * NUM_COLS;
var currentWordIndex = 0;
var currentDirection = Direction.ACROSS;
var isGameInProgress = false;
var stopwatchId;
var secondsPassed = 0;

function initWords() {
    crosswordStatusGrid = Array.from({ length: NUM_ROWS }, () => new Array(NUM_COLS).fill(Status.UNOCCUPIED));
    for (var i = 0; i < NUM_ROWS; i++) {
        for (var j = 0; j < NUM_COLS; j++) {
            var index = i * NUM_ROWS + j;
            var letterTileElement = document.createElementNS(SVG_NS, 'g');
            letterTileElement.setAttribute('class', 'letter-cell');
            letterTileElement.setAttribute('id', index);
            letterTileElement.addEventListener('click', clickTile);
            var letterRectElement = document.createElementNS(SVG_NS, 'rect');
            letterRectElement.setAttribute('role', 'cell');
            letterRectElement.setAttribute('class', 'cell');
            letterRectElement.setAttribute('id', 'cell-' + index);
            letterRectElement.setAttribute('aria-label', index);
            letterRectElement.setAttribute('x', GRID_STROKE_WIDTH + CELL_SIZE * j);
            letterRectElement.setAttribute('y', GRID_STROKE_WIDTH + CELL_SIZE * i);
            letterRectElement.setAttribute('width', CELL_SIZE);
            letterRectElement.setAttribute('height', CELL_SIZE);
            if (SECRET_CROSSWORD[i][j].number >= 0) {
                letterRectElement.setAttribute('class', 'cell-unfilled');
                var letterTextElement = document.createElementNS(SVG_NS, 'text');
                letterTextElement.setAttribute('class', 'letter');
                letterTextElement.setAttribute('id', 'letter-' + index);
                letterTextElement.setAttribute('aria-label', index);
                letterTextElement.setAttribute('x', GRID_STROKE_WIDTH + CELL_SIZE * j + CELL_SIZE / 4);
                letterTextElement.setAttribute('y', GRID_STROKE_WIDTH + CELL_SIZE * i + TILE_TEXT_FONT_SIZE + CELL_SIZE / 4);
                letterTextElement.setAttribute('text-anchor', 'start');
                letterTextElement.setAttribute('font-size', TILE_TEXT_FONT_SIZE);
                letterTileElement.appendChild(letterTextElement);
                crosswordStatusGrid[i][j] = Status.UNFILLED;
            }
            letterTileElement.appendChild(letterRectElement);
            if (SECRET_CROSSWORD[i][j].number >= 1) {
                if (index < currentIndex) currentIndex = index;
                var letterNumberElement = document.createElementNS(SVG_NS, 'text');
                letterNumberElement.setAttribute('x', GRID_STROKE_WIDTH + CELL_SIZE * j + GRID_STROKE_WIDTH);
                letterNumberElement.setAttribute('y', GRID_STROKE_WIDTH + CELL_SIZE * i + TILE_NUMBER_FONT_SIZE);
                letterNumberElement.setAttribute('text-anchor', 'start');
                letterNumberElement.setAttribute('font-size', TILE_NUMBER_FONT_SIZE);
                letterNumberElement.innerHTML = SECRET_CROSSWORD[i][j].number;
                letterTileElement.appendChild(letterNumberElement);
            }
            document.getElementById('cells').appendChild(letterTileElement);
        }
    }
    console.log(crosswordStatusGrid);
    highlightTiles();
}

function startStopwatch() {
    // Start the interval, saving the ID to a variable
    if (!stopwatchId && isGameInProgress) {
        stopwatchId = setInterval(function() {
            secondsPassed++;
            document.getElementById('timer').innerHTML = Math.floor(secondsPassed / 60) + ':' + String(secondsPassed % 60).padStart(2, '0');
        }, 1000);
    }
}

function stopStopwatch() {
    if (stopwatchId) {
        clearInterval(stopwatchId);
        stopwatchId = null;
    }
}

function highlightTiles() {
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    var m;
    var n;
    var index;
    // Clear all tiles first
    for (m = 0; m < NUM_ROWS; m++) {
        for (n = 0; n < NUM_COLS; n++) {
            if (SECRET_CROSSWORD[m][n].number >= 0) {
                index = m * NUM_ROWS + n;
                var letterRectElement = document.getElementById('cell-' + index);
                letterRectElement.setAttribute('class', 'cell-unfilled');
            }
        }
    }
    // Then select and highlight tiles
    var letterRectElement;
    if (currentDirection == Direction.ACROSS) {
        for (n = 0; n < NUM_COLS; n++) {
            if (SECRET_CROSSWORD[i][n].number >= 0) {
                index = i * NUM_ROWS + n;
                letterRectElement = document.getElementById('cell-' + index);
                letterRectElement.setAttribute('class', 'cell-highlighted');
            }
        }
        document.getElementById('hint').innerHTML = SECRET_WORDS[SECRET_CROSSWORD[i][j].acrossIndex].hint;
    } else if (currentDirection == Direction.DOWN) {
        for (m = 0; m < NUM_ROWS; m++) {
            if (SECRET_CROSSWORD[m][j].number >= 0) {
                index = m * NUM_ROWS + j;
                letterRectElement = document.getElementById('cell-' + index);
                letterRectElement.setAttribute('class', 'cell-highlighted');
            }
        }
        document.getElementById('hint').innerHTML = SECRET_WORDS[SECRET_CROSSWORD[i][j].downIndex].hint;
    }
    letterRectElement = document.getElementById('cell-' + currentIndex);
    letterRectElement.setAttribute('class', 'cell-selected');
}

function deleteCurrentLetter() {
    var letterTextElement = document.getElementById('letter-' + currentIndex);
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    letterTextElement.textContent = '';
    crosswordStatusGrid[i][j] = Status.UNFILLED;
}

function goToPrevWord() {
    currentWordIndex--;
    if (currentWordIndex == -1) currentWordIndex = SECRET_WORDS.length - 1;
    currentIndex = SECRET_WORDS[currentWordIndex].startPosition;
    currentDirection = SECRET_WORDS[currentWordIndex].direction;
    var counter = SECRET_WORDS.length - 2;
    var nextIndex = getNextIndexOfWord();
    while (counter > 0 && nextIndex == -1) {
        // While the current word is filled and we have not cycled through all the words, go to the previous word
        currentWordIndex--;
        if (currentWordIndex == -1) currentWordIndex = SECRET_WORDS.length - 1;
        // currentIndex = SECRET_WORDS[currentWordIndex].startPosition;
        nextIndex = getNextIndexOfWord();
        counter--;
    }
    currentIndex = nextIndex;
    currentDirection = SECRET_WORDS[currentWordIndex].direction;
    highlightTiles();
}

function goToNextWord() {
    currentWordIndex++;
    if (currentWordIndex == SECRET_WORDS.length) currentWordIndex = 0;
    currentIndex = SECRET_WORDS[currentWordIndex].startPosition;
    currentDirection = SECRET_WORDS[currentWordIndex].direction;
    var counter = SECRET_WORDS.length - 2;
    var nextIndex = getNextIndexOfWord();
    while (counter > 0 && nextIndex == -1) {
        // While the current word is filled and we have not cycled through all the words, go to the next word
        currentWordIndex++;
        if (currentWordIndex == SECRET_WORDS.length) currentWordIndex = 0;
        // currentIndex = SECRET_WORDS[currentWordIndex].startPosition;
        nextIndex = getNextIndexOfWord();
        counter--;
    }
    currentIndex = nextIndex;
    currentDirection = SECRET_WORDS[currentWordIndex].direction;
    highlightTiles();
}

function moveBackwards() {
    if (isAtBeginningOfWord()) goToPrevWord();
    else {
        if (currentDirection == Direction.ACROSS) currentIndex--;
        else currentIndex -= 5;
    }
}

function moveForward() {
    if (isCrosswordFilled() && isAtEndOfWord()) currentIndex = SECRET_WORDS[currentWordIndex].startPosition;
    else {
        if (currentDirection == Direction.ACROSS) currentIndex++;
        else currentIndex += 5;
    }
    var nextIndex = getNextIndexOfWord();
    if (nextIndex == -1) goToNextWord();
    else currentIndex = nextIndex;
}

function clickTile(element) {
    var index = -1;
    if (element.srcElement.classList.contains("letter-cell")) {
        index = Number(element.srcElement.id);
    } else if (element.srcElement.classList.contains("cell-unfilled")
                || element.srcElement.classList.contains("cell-highlighted")
                || element.srcElement.classList.contains("cell-selected")
                || element.srcElement.classList.contains("letter")) {
        index = Number(element.srcElement.ariaLabel);
    }
    if (index + 1) {
        var i = Math.floor(index / NUM_ROWS);
        var j = index % NUM_ROWS;
        if (index != currentIndex && SECRET_CROSSWORD[i][j].number >= 0) {
            currentIndex = index;
        } else if (index == currentIndex && SECRET_CROSSWORD[i][j].number >= 0) {
            currentDirection = !currentDirection;
        }
        // If the current selected word does not have the same direction as the current direction, flip
        i = Math.floor(currentIndex / NUM_ROWS);
        j = currentIndex % NUM_ROWS;
        if (currentDirection == Direction.ACROSS && SECRET_CROSSWORD[i][j].acrossIndex < 0
            || currentDirection == Direction.DOWN && SECRET_CROSSWORD[i][j].downIndex < 0) {
            currentDirection = !currentDirection;
        }
        // Update the current word based on the direction
        if (currentDirection == Direction.ACROSS) {
            currentWordIndex = SECRET_CROSSWORD[i][j].acrossIndex;
        } else if (currentDirection == Direction.DOWN) {
            currentWordIndex = SECRET_CROSSWORD[i][j].downIndex;
        }
        highlightTiles();
    }
}

function typeInputLetter(element) {
    if (element.srcElement.classList.contains("key") && element.srcElement.id != 'backspace-key') {
        // Replace existing letter with input letter
        var letter = element.srcElement.innerHTML;
        var letterTileElement = document.getElementById(currentIndex);
        var letterTextElement = document.getElementById('letter-' + currentIndex);
        var clonedLetterTextElement = letterTextElement.cloneNode(true);
        clonedLetterTextElement.textContent = letter;
        letterTileElement.appendChild(clonedLetterTextElement);
        letterTextElement.remove();
        // Preserve the current fill state of the crossword
        var crosswordIsFilled = isCrosswordFilled();
        // Grade the inputted letter
        var i = Math.floor(currentIndex / NUM_ROWS);
        var j = currentIndex % NUM_ROWS;
        if (letter == SECRET_CROSSWORD[i][j].letter) {
            crosswordStatusGrid[i][j] = Status.CORRECT;
        } else {
            crosswordStatusGrid[i][j] = Status.INCORRECT;
        }
        if (isCrosswordCorrect()) {
            // YOU WIN
            clearInterval(stopwatchId);
            console.log("You win!");
        } else if (!crosswordIsFilled && isCrosswordFilled()) {
            // Do nothing if the crossword was just filled
        } else {
            moveForward();
        }
        highlightTiles();
    }
}

function backspace() {
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    if (crosswordStatusGrid[i][j] == Status.UNFILLED) {
        // If tile is unfilled
        if (isAtBeginningOfWord()) {
            // If at beginning of word, go to previous word and remove the last letter
            currentWordIndex--;
            if (currentWordIndex == -1) currentWordIndex = SECRET_WORDS.length - 1;
            if (currentDirection == Direction.ACROSS) {
                currentIndex = SECRET_WORDS[currentWordIndex].startPosition + SECRET_WORDS[currentWordIndex].word.length - 1;
            } else if (currentDirection == Direction.DOWN) {
                currentIndex = SECRET_WORDS[currentWordIndex].startPosition + 5 * (SECRET_WORDS[currentWordIndex].word.length - 1);
            }
            currentDirection = SECRET_WORDS[currentWordIndex].direction;
            deleteCurrentLetter();
        } else {
            // Move backwards and remove letter
            moveBackwards();
            deleteCurrentLetter();
        }
    } else {
        // If tile has a letter, remove the letter and do not move backwards
        deleteCurrentLetter();
    }
    highlightTiles();
}

function isAtBeginningOfWord() {
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    return (currentDirection == Direction.ACROSS && (j - 1 == -1 || SECRET_CROSSWORD[i][j-1].number < 0)
        || currentDirection == Direction.DOWN && (i - 1 == -1 || SECRET_CROSSWORD[i-1][j].number < 0));
}

function isAtEndOfWord() {
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    return (currentDirection == Direction.ACROSS && (j + 1 == NUM_COLS || SECRET_CROSSWORD[i][j+1].number < 0)
        || currentDirection == Direction.DOWN && (i + 1 == NUM_ROWS || SECRET_CROSSWORD[i+1][j].number < 0));
}

// If word is not filled, return next index; else -1
function getNextIndexOfWord() {
    var crosswordIsFilled = isCrosswordFilled();
    if (!crosswordIsFilled) currentIndex = SECRET_WORDS[currentWordIndex].startPosition;
    currentDirection = SECRET_WORDS[currentWordIndex].direction;
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    if (currentDirection == Direction.ACROSS) {
        var counter = NUM_COLS;
        while (counter > 0) {
            if (crosswordStatusGrid[i][j] == Status.UNFILLED
                || crosswordIsFilled && crosswordStatusGrid[i][j] != Status.UNOCCUPIED) {
                return i * NUM_ROWS + j;
            }
            j = (j + 1) % NUM_COLS;
            counter--;
        }
    } else if (currentDirection == Direction.DOWN) {
        var counter = NUM_ROWS;
        while (counter > 0) {
            if (crosswordStatusGrid[i][j] == Status.UNFILLED
                || crosswordIsFilled && crosswordStatusGrid[i][j] != Status.UNOCCUPIED) {
                return i * NUM_ROWS + j;
            }
            i = (i + 1) % NUM_ROWS;
            counter--;
        }
    }
    return -1;
}

function isCrosswordCorrect() {
    for (var i = 0; i < crosswordStatusGrid.length; i++) {
        for (var j = 0; j < crosswordStatusGrid[i].length; j++) {
            if (crosswordStatusGrid[i][j] == Status.UNFILLED || crosswordStatusGrid[i][j] == Status.INCORRECT) {
                return false;
            }
        }
    }
    return true;
}

function isCrosswordFilled() {
    for (var i = 0; i < crosswordStatusGrid.length; i++) {
        for (var j = 0; j < crosswordStatusGrid[i].length; j++) {
            if (crosswordStatusGrid[i][j] == Status.UNFILLED) {
                return false;
            }
        }
    }
    return true;
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
document.getElementById('left').addEventListener('click', goToPrevWord);
document.getElementById('right').addEventListener('click', goToNextWord);
Array.from(document.getElementsByClassName('key')).forEach(function(e) {
    addEventListener('click', typeInputLetter);
});
document.getElementById('backspace-key').addEventListener('click', backspace);

initWords();

// If user navigates away from window, pause stopwatch
window.addEventListener('blur', function (e) {
    stopStopwatch();
});

// If user navigates back to window, start stopwatch
window.addEventListener('focus', function (e) {
    startStopwatch();
});