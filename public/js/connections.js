function hideIntroPage() {
    setCookie("date", new Date(), NUM_EXPIRATION_DAYS);
    document.getElementsByClassName('intro-screen-container')[0].style.display = "none";
}

function goBack() {
    window.history.back();
}

const Status = Object.freeze({
    UNSELECTED: 0,
    SELECTED: 1,
    CORRECT: 2,
});
const CONNECTIONS_DIR_PATH = "../txt/connections/";
const NUM_TOTAL_WORDS = 16;
const NUM_WORDS_IN_A_GROUP = 4;
const NUM_TOTAL_GROUPS = 4;
const NUM_MISTAKES_ALLOWED = 4;
/* Connections solution */
// Word groups in order of easiest to most difficult
var secretGroups = [];
/* Connections game variables */
var secretGroupsLeft = [];
// Each entry contains the Status of the word, ordered based on the grid index
var wordStatusList = [];
var selectedWords = [];
var numRowsLeft = NUM_TOTAL_GROUPS;
var canSelect = true;
/* Connections game state */
// Each row represents a group of words that were submitted
// Each entry of the row is an index of the category the word is actually in
var submittedWords = [];
var gameWinState = false;
var numMistakesRemaining = NUM_MISTAKES_ALLOWED;
/* Strands game streak and stats */
var numPlayed = 0;
var winPercentage = 0;
var winStreak = 0;
var winStreakMax = 0;

function loadGameState() {
    numPlayed = Number(getCookie("connections-num-played"));
    winPercentage = Number(getCookie("connections-win-percentage"));
    winStreak = Number(getCookie("connections-win-streak"));
    winStreakMax = Number(getCookie("connections-win-streak-max"));
}

function convertArrayTo2D(array, num_columns) {
    const result = [];
    for (let i = 0; i < array.length; i += num_columns) {
        result.push(array.slice(i, i + num_columns));
    }
    return result;
}

function fillSubmittedWords() {
    secretGroupsLeft = structuredClone(secretGroups);
    // First make the submitted words list into a 2D array for simplicity later
    let submittedWordsList = getCookie("connections-submitted-words").split(',').filter(item => item.length > 0).map(item => Number(item));
    submittedWords = convertArrayTo2D(submittedWordsList, NUM_WORDS_IN_A_GROUP);
    // Fill in the answer groups that have been found
    for (var group of submittedWords) {
        if (group.every(item => item == group[0])) {
            // Show the answer group
            showAnswerGroup(group[0]);
        }
    }
    document.getElementById('connections-grid').style.gridTemplateRows = "repeat(" + numRowsLeft + ", 1fr)";
    document.getElementById('connections-grid').style.height = "calc(" + NUM_TOTAL_GROUPS * (numRowsLeft - 1) + "px + " + numRowsLeft + " * 22.5vw)";
    // Proceed to fill the rest of the words in the grid
    shuffleWords();
    console.log(wordStatusList);
}

function initWords() {
    loadGameState();
    // Read the connections file for the current day
    let day = Number(getCookie("day"));
    let date = getFullDate(new Date());
    document.getElementById('intro-day').innerHTML = day;
    document.getElementById('intro-date').innerHTML = date;
    let connectionsFilePath = CONNECTIONS_DIR_PATH + day + ".txt";
    const response = fetch(connectionsFilePath)
    .then(response => response.text())
    .then(data => {
        const itemsArray = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        for (var i = 0; i < NUM_TOTAL_GROUPS; i++) {
            var indexOfSeparator = itemsArray[i].indexOf(':');
            var category = itemsArray[i].slice(0, indexOfSeparator);
            var words = itemsArray[i].slice(indexOfSeparator + 1).split(',').filter(item => item.length > 0);
            secretGroups.push({ category: category, words: words });
        }

        let storedMistakesRemaining = getCookie("connections-mistakes-remaining");
        if (storedMistakesRemaining != "") {
            // Use the mistakes counter instead of the default starting number
            numMistakesRemaining = Number(getCookie("connections-mistakes-remaining"));
            for (var i = NUM_MISTAKES_ALLOWED - 1; i >= numMistakesRemaining; i--) {
                document.getElementById('mistake-' + i).style.display = "none";
            }
        }
        let storedGameState = getCookie("connections-game-state");
        // Regardless of whether the game was started or not, fill in the words of the grid
        fillSubmittedWords();
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

function clickWord(element) {
    if (canSelect && element.srcElement.classList.contains("connections-tile")) {
        var wordIndex = element.srcElement.id;
        var word = wordStatusList[wordIndex].word;
        if (wordStatusList[wordIndex].status == Status.UNSELECTED && selectedWords.length < NUM_WORDS_IN_A_GROUP) {
            element.srcElement.classList.add("selected");
            wordStatusList[wordIndex].status = Status.SELECTED;
            selectedWords.push(word);
            document.getElementById('deselect-button').disabled = false;
            if (selectedWords.length == NUM_WORDS_IN_A_GROUP) {
                // Check if this group of selected words has already been submitted
                // var hasBeenSubmitted = false;
                // for (var words of submittedWords) {
                //     var diff = words.filter(item => !selectedWords.includes(item));
                //     if (diff.length == 0) hasBeenSubmitted = true;
                // }
                // if (!hasBeenSubmitted) {
                    document.getElementById('submit-button').disabled = false;
                // }
            }
        } else if (wordStatusList[wordIndex].status == Status.SELECTED) {
            element.srcElement.classList.remove("selected");
            wordStatusList[wordIndex].status = Status.UNSELECTED;
            selectedWords = selectedWords.filter(item => item !== word);
            if (selectedWords.length == 0) {
                document.getElementById('deselect-button').disabled = true;
            }
            if (selectedWords.length < NUM_WORDS_IN_A_GROUP) {
                document.getElementById('submit-button').disabled = true;
            }
        }
    }
}

function shuffleWords() {
    // First reset the grid by removing all the existing tiles
    wordStatusList = [];
    Array.from(document.getElementsByClassName('connections-tile')).forEach(function(e) {
        e.remove();
    });
    // Then randomize the index of each word into a tile
    for (var i = 0; i < secretGroupsLeft.length; i++) {
        for (var word of secretGroupsLeft[i].words) {
            var randomIndex = Math.floor(Math.random() * NUM_TOTAL_WORDS);
            while (wordStatusList[randomIndex]) {
                randomIndex = Math.floor(Math.random() * NUM_TOTAL_WORDS);
            }
            wordStatusList[randomIndex] = { "word": word, "status": Status.UNSELECTED };
        }
    }
    for (var index = 0; index < wordStatusList.length; index++) {
        if (wordStatusList[index]) {
            var tileElement = document.createElement("div");
            tileElement.className = "connections-tile";
            tileElement.id = index;
            tileElement.innerHTML = wordStatusList[index].word;
            tileElement.style.fontSize = "calc(22.5vw / " + Math.max(8, word.length) + " + 2px)";
            var gridElement = document.getElementById("connections-grid");
            gridElement.appendChild(tileElement);
        }
    }
    Array.from(document.getElementsByClassName('connections-tile')).forEach(function(e) {
        addEventListener('click', clickWord);
    });
}

function deselectAllWords() {
    Array.from(document.getElementsByClassName('selected')).forEach(function(element) {
        element.classList.remove("selected");
        wordStatusList[element.id].status = Status.UNSELECTED;
    });
    selectedWords = [];
    document.getElementById('deselect-button').disabled = true;
    document.getElementById('submit-button').disabled = true;
}

function showAnswerGroup(difficultyIndex) {
    var answerGroupElement = document.createElement('div');
    answerGroupElement.id = "answer-" + difficultyIndex;
    answerGroupElement.className = "answer-group";
    answerGroupElement.innerHTML =
        '<p class="answer-heading">' + secretGroups[difficultyIndex].category + '</p>' +
        '<p>' + secretGroups[difficultyIndex].words.join(", ") + '</p>';
    document.getElementsByClassName('connections-solved')[0].appendChild(answerGroupElement);
    secretGroupsLeft.splice(difficultyIndex, 1);
    numRowsLeft--;
}

function submitWords() {
    // Finds the closest category that matches the group of selected words
    var bestMatchCategory = { difficultyIndex: -1, diff: 0 };
    for (var index = 0; index < secretGroups.length; index++) {
        var diff = secretGroups[index].words.filter(item => !selectedWords.includes(item));
        if (bestMatchCategory.difficultyIndex == -1 || diff.length < bestMatchCategory.diff) {
            bestMatchCategory = { difficultyIndex: index, diff: diff.length };
        }
    }
    console.log(bestMatchCategory);
    // Add the actual category that each word belongs to to the submitted words
    var actualCategoryOfWords = selectedWords.map(word => secretGroups.findIndex(group => { return group.words.includes(word) }));
    submittedWords.push(actualCategoryOfWords);
    setCookie("connections-submitted-words", submittedWords);
    document.getElementById('submit-button').disabled = true;
    if (bestMatchCategory.diff == 0) {
        // If the group of selected words is correct, show the answer group
        showAnswerGroup(bestMatchCategory.difficultyIndex);
        // Remove selected tiles
        Array.from(document.getElementsByClassName('selected')).forEach(function(element) {
            element.remove();
            wordStatusList[element.id].status = Status.CORRECT;
        });
        selectedWords = [];
        document.getElementById('deselect-button').disabled = true;
        document.getElementById('connections-grid').style.gridTemplateRows = "repeat(" + numRowsLeft + ", 1fr)";
        document.getElementById('connections-grid').style.height = "calc(" + NUM_TOTAL_GROUPS * (numRowsLeft - 1) + "px + " + numRowsLeft + " * 22.5vw)";
        if (numRowsLeft == 0) {
            // YOU WIN
            setWinGameState(true);
        }
    } else {
        if (bestMatchCategory.diff == 1) {
            // Show the toast if the answer group is one away
            var toastElement = document.getElementById("one-away");
            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);
            toastBootstrap.show();
        }
        numMistakesRemaining--;
        setCookie("connections-mistakes-remaining", numMistakesRemaining);
        if (numMistakesRemaining < 0) {
            // Game over
            setLoseGameState(true);
        } else {
            document.getElementById('mistake-' + numMistakesRemaining).style.display = "none";
        }
    }
}

function setWinGameState(updateGameStats) {
    gameWinState = true;
    if (updateGameStats) {
        var numWon = winPercentage / 100 * numPlayed;
        numPlayed++;
        winPercentage = (numWon + 1) / numPlayed * 100;
        winStreak++;
        winStreakMax = Math.max(winStreakMax, winStreak);
        setCookie("connections-game-state", gameWinState, NUM_EXPIRATION_DAYS);
        setCookie("connections-num-played", numPlayed, NUM_EXPIRATION_DAYS);
        setCookie("connections-win-percentage", winPercentage, NUM_EXPIRATION_DAYS);
        setCookie("connections-win-streak", winStreak, NUM_EXPIRATION_DAYS);
        setCookie("connections-win-streak-max", winStreakMax, NUM_EXPIRATION_DAYS);
    }
    document.getElementById('mistakes-counter').style.visibility = "hidden";
    document.getElementById('action-buttons').style.visibility = "hidden";
    document.getElementById('view-results-button').style.display = "inline";
    var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
    canSelect = false;
    console.log("You win!");
}

function setLoseGameState(updateGameStats) {
    if (updateGameStats) {
        var numWon = winPercentage / 100 * numPlayed;
        numPlayed++;
        winPercentage = (numWon) / numPlayed * 100;
        winStreak = 0;
        setCookie("connections-game-state", gameWinState, NUM_EXPIRATION_DAYS);
        setCookie("connections-num-played", numPlayed, NUM_EXPIRATION_DAYS);
        setCookie("connections-win-percentage", winPercentage, NUM_EXPIRATION_DAYS);
        setCookie("connections-win-streak", winStreak, NUM_EXPIRATION_DAYS);
    }
    document.getElementById('mistakes-counter').style.visibility = "hidden";
    document.getElementById('action-buttons').style.visibility = "hidden";
    document.getElementById('view-results-button').style.display = "inline";
    var resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
    canSelect = false;
    console.log("Game over");
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
    // Load connections history bubbles
    document.getElementById('connections-history').innerHTML = "";
    for (var group of submittedWords) {
        var connectionsHistoryBubbleRowElement = document.createElement('div');
        for (var difficultyIndex of group) {
            var bubbleElement = document.createElement('span');
            bubbleElement.classList.add('answer-' + difficultyIndex);
            connectionsHistoryBubbleRowElement.append(bubbleElement);
        }
        document.getElementById('connections-history').append(connectionsHistoryBubbleRowElement);
    }

    document.getElementById('back-to-home-button').addEventListener('click', goBack);
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
document.getElementById('shuffle-button').addEventListener('click', shuffleWords);
document.getElementById('deselect-button').addEventListener('click', deselectAllWords);
document.getElementById('submit-button').addEventListener('click', submitWords);
document.getElementById('resultsModal').addEventListener('shown.bs.modal', loadResults);

initWords();