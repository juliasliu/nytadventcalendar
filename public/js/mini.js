function hideIntroPage() {
    document.getElementsByClassName('intro-screen-container')[0].style.display = "none";
    isGameInProgress = true;
    if (!gameWinState) startStopwatch();
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
const MINI_DIR_PATH = "../txt/mini/";
const CELL_SIZE = 100;
const GRID_STROKE_WIDTH = 3;
const TILE_NUMBER_FONT_SIZE = 32;
const TILE_TEXT_FONT_SIZE = 64;
const SVG_NS = 'http://www.w3.org/2000/svg';
const NUM_ROWS = 5;
const NUM_COLS = 5;
/* Mini solution */
// Words are ordered from sequential order
var secretWords = [];
/* Mini game variables */
/** The number represents the number of the word, e.g. 1 to 7.
 *  -1: The space is blank.
 *   0: The space is not the first letter of the word.
 *  The acrossIndex and downIndex values correspond to the index of the word in secretWords.
 *  -1: The space does not correspond to any word.
 */
/**
 *  - - A M Y
 *  W - P - E
 *  H O R S E
 *  I - I - T
 *  M I L K -
 */
var crosswordGrid = [];
var crosswordStatusGrid = [];
var currentIndex = NUM_ROWS * NUM_COLS;
var currentWordIndex = 0;
var currentDirection = Direction.ACROSS;
var isGameInProgress = false;
var stopwatchId;
var canType = true;
/* Mini game state */
// Each entry is the letter of the word that was typed in
var submittedGrid = [];
var gameWinState = false;
var secondsPassed = 0;
/* Mini game streak and stats */
var numPlayed = 0;
var winPercentage = 0;
var winStreak = 0;
var winStreakMax = 0;

function loadGameState() {
    numPlayed = Number(getCookie("mini-num-played"));
    winPercentage = Number(getCookie("mini-win-percentage"));
    winStreak = Number(getCookie("mini-win-streak"));
    winStreakMax = Number(getCookie("mini-win-streak-max"));
}

function fillSubmittedWords() {
    // Fill in the crossword status grid based on the crossword grid
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
            if (crosswordGrid[i][j].number >= 0) {
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
            if (crosswordGrid[i][j].number >= 1) {
                if (index < currentIndex) currentIndex = index;
                var letterNumberElement = document.createElementNS(SVG_NS, 'text');
                letterNumberElement.setAttribute('x', GRID_STROKE_WIDTH + CELL_SIZE * j + GRID_STROKE_WIDTH);
                letterNumberElement.setAttribute('y', GRID_STROKE_WIDTH + CELL_SIZE * i + TILE_NUMBER_FONT_SIZE);
                letterNumberElement.setAttribute('text-anchor', 'start');
                letterNumberElement.setAttribute('font-size', TILE_NUMBER_FONT_SIZE);
                letterNumberElement.innerHTML = crosswordGrid[i][j].number;
                letterTileElement.appendChild(letterNumberElement);
            }
            document.getElementById('cells').appendChild(letterTileElement);
        }
    }
    // Fill in the completed words in the crossword
    submittedGrid = getCookie("mini-submitted-grid").split(',');
    for (var index = 0; index < submittedGrid.length; index++) {
        if (submittedGrid[index] != '') {
            currentIndex = index;
            var letter = submittedGrid[index];
            insertLetterTile(letter);
            gradeTile(letter);
        }
    }
    console.log(crosswordStatusGrid);
    moveForward();
    highlightTiles();
}

function initWords() {
    loadGameState();
    // Read the mini file for the current day
    let day = Number(getCookie("day"));
    let date = getFullDate(new Date());
    document.getElementById('intro-day').innerHTML = day;
    document.getElementById('intro-date').innerHTML = date;
    let miniFilePath = MINI_DIR_PATH + day + ".txt";
    const response = fetch(miniFilePath)
    .then(response => response.text())
    .then(data => {
        const itemsArray = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        // Load the secret groups
        for (var item of itemsArray) {
            var split = item.split(',').map(item => item.trim()).filter(item => item.length > 0);
            var secretWord = {
                hint: split[0],
                word: split[1],
                startPosition: Number(split[2]),
                direction: Number(split[3]),
            }
            secretWords.push(secretWord);
        }
        // Load the crossword grid based on the secret groups
        crosswordGrid = Array.from(
            { length: NUM_ROWS }, 
            () => Array.from(
                {length: NUM_COLS}, () => ({ number: -1, acrossIndex: -1, downIndex: -1, letter: '' })
            )
        );
        var wordNumber = 1;
        for (var wordIndex = 0; wordIndex < secretWords.length; wordIndex++) {
            var secretWord = secretWords[wordIndex];
            var i = Math.floor(secretWord.startPosition / NUM_ROWS);
            var j = secretWord.startPosition % NUM_ROWS;
            if (secretWord.direction == Direction.ACROSS) {
                for (var counter = 0; counter < secretWord.word.length; counter++) {
                    if (counter == 0 && crosswordGrid[i][j + counter].number < 1) {
                        crosswordGrid[i][j + counter].number = wordNumber;
                        wordNumber++;
                    } else if (crosswordGrid[i][j + counter].number < 1) {
                        crosswordGrid[i][j + counter].number = 0;
                    }
                    crosswordGrid[i][j + counter].acrossIndex = wordIndex;
                    crosswordGrid[i][j + counter].letter = secretWord.word[counter];
                }
            } else if (secretWord.direction == Direction.DOWN) {
                for (var counter = 0; counter < secretWord.word.length; counter++) {
                    if (counter == 0 && crosswordGrid[i + counter][j].number < 1) {
                        crosswordGrid[i + counter][j].number = wordNumber;
                        wordNumber++;
                    } else if (crosswordGrid[i + counter][j].number < 1) {
                        crosswordGrid[i + counter][j].number = 0;
                    }
                    crosswordGrid[i + counter][j].downIndex = wordIndex;
                    crosswordGrid[i + counter][j].letter = secretWord.word[counter];
                }
            }
        }
        console.log(crosswordGrid);

        let storedGameState = getCookie("mini-game-state");
        // Regardless of whether the game was started or not, fill in the words of the grid
        fillSubmittedWords();
        let storedSecondsPassed = getCookie("mini-seconds-passed");
        if (storedSecondsPassed != "") {
            secondsPassed = storedSecondsPassed;
            document.getElementById('timer').innerHTML = Math.floor(secondsPassed / 60) + ':' + String(secondsPassed % 60).padStart(2, '0');
        }
        if (storedGameState != "") {
            // If today's game has been finished, show the game results modal
            hideIntroPage();
            if (JSON.parse(storedGameState)) {
                setWinGameState();
            } else {
                setLoseGameState();
            }
        }
    });
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
        setCookie("mini-seconds-passed", secondsPassed);
    }
}

function pauseStopwatch() {
    if (stopwatchId) {
        stopStopwatch();
        var pauseModal = new bootstrap.Modal(document.getElementById('pauseModal'));
        pauseModal.show();
    } else {
        startStopwatch();
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
            if (crosswordGrid[m][n].number >= 0) {
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
            if (crosswordGrid[i][n].number >= 0) {
                index = i * NUM_ROWS + n;
                letterRectElement = document.getElementById('cell-' + index);
                letterRectElement.setAttribute('class', 'cell-highlighted');
            }
        }
        document.getElementById('hint').innerHTML = secretWords[crosswordGrid[i][j].acrossIndex].hint;
    } else if (currentDirection == Direction.DOWN) {
        for (m = 0; m < NUM_ROWS; m++) {
            if (crosswordGrid[m][j].number >= 0) {
                index = m * NUM_ROWS + j;
                letterRectElement = document.getElementById('cell-' + index);
                letterRectElement.setAttribute('class', 'cell-highlighted');
            }
        }
        document.getElementById('hint').innerHTML = secretWords[crosswordGrid[i][j].downIndex].hint;
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
    if (currentWordIndex == -1) currentWordIndex = secretWords.length - 1;
    currentIndex = secretWords[currentWordIndex].startPosition;
    currentDirection = secretWords[currentWordIndex].direction;
    var counter = secretWords.length - 2;
    var nextIndex = getNextIndexOfWord();
    while (counter > 0 && nextIndex == -1) {
        // While the current word is filled and we have not cycled through all the words, go to the previous word
        currentWordIndex--;
        if (currentWordIndex == -1) currentWordIndex = secretWords.length - 1;
        // currentIndex = secretWords[currentWordIndex].startPosition;
        nextIndex = getNextIndexOfWord();
        counter--;
    }
    currentIndex = nextIndex;
    currentDirection = secretWords[currentWordIndex].direction;
    highlightTiles();
}

function goToNextWord() {
    currentWordIndex++;
    if (currentWordIndex == secretWords.length) currentWordIndex = 0;
    currentIndex = secretWords[currentWordIndex].startPosition;
    currentDirection = secretWords[currentWordIndex].direction;
    var counter = secretWords.length - 2;
    var nextIndex = getNextIndexOfWord();
    while (counter > 0 && nextIndex == -1) {
        // While the current word is filled and we have not cycled through all the words, go to the next word
        currentWordIndex++;
        if (currentWordIndex == secretWords.length) currentWordIndex = 0;
        // currentIndex = secretWords[currentWordIndex].startPosition;
        nextIndex = getNextIndexOfWord();
        counter--;
    }
    currentIndex = nextIndex;
    currentDirection = secretWords[currentWordIndex].direction;
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
    if (isCrosswordFilled() && isAtEndOfWord()) currentIndex = secretWords[currentWordIndex].startPosition;
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
        if (index != currentIndex && crosswordGrid[i][j].number >= 0) {
            currentIndex = index;
        } else if (index == currentIndex && crosswordGrid[i][j].number >= 0) {
            currentDirection = !currentDirection;
        }
        // If the current selected word does not have the same direction as the current direction, flip
        i = Math.floor(currentIndex / NUM_ROWS);
        j = currentIndex % NUM_ROWS;
        if (currentDirection == Direction.ACROSS && crosswordGrid[i][j].acrossIndex < 0
            || currentDirection == Direction.DOWN && crosswordGrid[i][j].downIndex < 0) {
            currentDirection = !currentDirection;
        }
        // Update the current word based on the direction
        if (currentDirection == Direction.ACROSS) {
            currentWordIndex = crosswordGrid[i][j].acrossIndex;
        } else if (currentDirection == Direction.DOWN) {
            currentWordIndex = crosswordGrid[i][j].downIndex;
        }
        highlightTiles();
    }
}

function insertLetterTile(letter) {
    // Replace existing letter with input letter
    var letterTileElement = document.getElementById(currentIndex);
    var letterTextElement = document.getElementById('letter-' + currentIndex);
    var clonedLetterTextElement = letterTextElement.cloneNode(true);
    clonedLetterTextElement.textContent = letter;
    letterTileElement.appendChild(clonedLetterTextElement);
    letterTextElement.remove();
}

function gradeTile(letter) {
    // Grade the inputted letter
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    if (letter == crosswordGrid[i][j].letter) {
        crosswordStatusGrid[i][j] = Status.CORRECT;
    } else {
        crosswordStatusGrid[i][j] = Status.INCORRECT;
    }
}

function typeInputLetter(element) {
    if (canType && element.srcElement.classList.contains("key") && element.srcElement.id != 'backspace-key') {
        var letter = element.srcElement.innerHTML;
        // Insert letter into the current index tile and update submitted letters
        insertLetterTile(letter);
        submittedGrid[currentIndex] = letter;
        setCookie("mini-submitted-grid", submittedGrid);
        // Preserve the current fill state of the crossword
        var crosswordIsFilled = isCrosswordFilled();
        gradeTile(letter);
        if (isCrosswordCorrect()) {
            // YOU WIN
            setWinGameState(true);
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
            if (currentWordIndex == -1) currentWordIndex = secretWords.length - 1;
            if (currentDirection == Direction.ACROSS) {
                currentIndex = secretWords[currentWordIndex].startPosition + secretWords[currentWordIndex].word.length - 1;
            } else if (currentDirection == Direction.DOWN) {
                currentIndex = secretWords[currentWordIndex].startPosition + 5 * (secretWords[currentWordIndex].word.length - 1);
            }
            currentDirection = secretWords[currentWordIndex].direction;
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
    return (currentDirection == Direction.ACROSS && (j - 1 == -1 || crosswordGrid[i][j-1].number < 0)
        || currentDirection == Direction.DOWN && (i - 1 == -1 || crosswordGrid[i-1][j].number < 0));
}

function isAtEndOfWord() {
    var i = Math.floor(currentIndex / NUM_ROWS);
    var j = currentIndex % NUM_ROWS;
    return (currentDirection == Direction.ACROSS && (j + 1 == NUM_COLS || crosswordGrid[i][j+1].number < 0)
        || currentDirection == Direction.DOWN && (i + 1 == NUM_ROWS || crosswordGrid[i+1][j].number < 0));
}

// If word is not filled, return next index; else -1
function getNextIndexOfWord() {
    var crosswordIsFilled = isCrosswordFilled();
    if (!crosswordIsFilled) currentIndex = secretWords[currentWordIndex].startPosition;
    currentDirection = secretWords[currentWordIndex].direction;
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

function setWinGameState(updateGameStats) {
    clearInterval(stopwatchId);
    gameWinState = true;
    if (updateGameStats) {
        var numWon = winPercentage * numPlayed;
        numPlayed++;
        winPercentage = (numWon + 1) / numPlayed * 100;
        winStreak++;
        winStreakMax = Math.max(winStreakMax, winStreak);
        setCookie("mini-game-state", gameWinState, NUM_EXPIRATION_DAYS);
        setCookie("mini-num-played", numPlayed, NUM_EXPIRATION_DAYS);
        setCookie("mini-win-percentage", winPercentage, NUM_EXPIRATION_DAYS);
        setCookie("mini-win-streak", winStreak, NUM_EXPIRATION_DAYS);
        setCookie("mini-win-streak-max", winStreakMax, NUM_EXPIRATION_DAYS);
    }
    var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
    canType = false;
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
    // Load the stopwatch time
    document.getElementById('time-spent').innerHTML = Math.floor(secondsPassed / 60) + ':' + String(secondsPassed % 60).padStart(2, '0');

    document.getElementById('back-to-home-button').addEventListener('click', goBack);
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
document.getElementById('left').addEventListener('click', goToPrevWord);
document.getElementById('right').addEventListener('click', goToNextWord);
Array.from(document.getElementsByClassName('key')).forEach(function(e) {
    addEventListener('click', typeInputLetter);
});
document.getElementById('backspace-key').addEventListener('click', backspace);
document.getElementById('timer').addEventListener('click', pauseStopwatch);
document.getElementById('resume-button').addEventListener('click', pauseStopwatch);
document.getElementById('resultsModal').addEventListener('shown.bs.modal', loadResults);

initWords();

// If user navigates away from window, pause stopwatch
window.addEventListener('blur', function (e) {
    stopStopwatch();
});

// If user navigates back to window, start stopwatch
window.addEventListener('focus', function (e) {
    startStopwatch();
});