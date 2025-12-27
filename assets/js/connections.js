function hideIntroPage() {
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
// Word groups in order of easiest to most difficult
const SECRET_GROUPS = [
    { category: "Words that mean dramatic", words: ["theatrical", "showy", "exaggerated", "riveting"] },
    { category: "Types of renewable energy", words: ["sun", "wind", "water", "biomass"] },
    { category: "Lorde album titles", words: ["melodrama", "pure heroine", "virgin", "solar power"] },
    { category: "Diorama parts", words: ["shoebox", "sand", "paint", "styrofoam"] },
];
var selectedGroups = [];
var selectedWords = [];
var pastSubmittedWords = [];
var numRowsLeft = 4;
var numMistakesRemaining = 4;

function initWords() {
    for (var i = 0; i < SECRET_GROUPS.length; i++) {
        for (var word of SECRET_GROUPS[i].words) {
            var randomIndex = Math.floor(Math.random() * 16);
            while (selectedGroups[randomIndex]) {
                randomIndex = Math.floor(Math.random() * 16);
            }
            selectedGroups[randomIndex] = { "word": word, "status": Status.UNSELECTED };
            document.getElementById(randomIndex).innerHTML = word;
        }
    }
    console.log(selectedGroups);
}

function clickWord(element) {
    if (element.srcElement.classList.contains("connections-tile")) {
        var wordIndex = element.srcElement.id;
        var word = selectedGroups[wordIndex].word;
        if (selectedGroups[wordIndex].status == Status.UNSELECTED && selectedWords.length < 4) {
            element.srcElement.classList.add("selected");
            selectedGroups[wordIndex].status = Status.SELECTED;
            selectedWords.push(word);
            document.getElementById('deselect-button').disabled = false;
            if (selectedWords.length == 4) {
                // Check if this group of selected words has already been submitted
                var hasBeenSubmitted = false;
                for (var words of pastSubmittedWords) {
                    var diff = words.filter(item => !selectedWords.includes(item));
                    if (diff.length == 0) hasBeenSubmitted = true;
                }
                if (!hasBeenSubmitted) {
                    document.getElementById('submit-button').disabled = false;
                }
            }
        } else if (selectedGroups[wordIndex].status == Status.SELECTED) {
            element.srcElement.classList.remove("selected");
            selectedGroups[wordIndex].status = Status.UNSELECTED;
            selectedWords = selectedWords.filter(item => item !== word);
            if (selectedWords.length == 0) {
                document.getElementById('deselect-button').disabled = true;
            }
            if (selectedWords.length < 4) {
                document.getElementById('submit-button').disabled = true;
            }
        }
    }
}

function shuffleWords() {

}

function deselectAllWords() {
    Array.from(document.getElementsByClassName('selected')).forEach(function(element) {
        element.classList.remove("selected");
        selectedGroups[element.id].status = Status.UNSELECTED;
    });
    selectedWords = [];
    document.getElementById('deselect-button').disabled = true;
    document.getElementById('submit-button').disabled = true;
}

function submitWords() {
    // Finds the closest category that matches the group of selected words
    var bestMatchCategory = { category: "", words: [], diff: 0 };
    for (var category of SECRET_GROUPS) {
        var diff = category.words.filter(item => !selectedWords.includes(item));
        if (!bestMatchCategory.category || diff.length < bestMatchCategory.diff) {
            bestMatchCategory = { category: category.category, words: category.words, diff: diff.length };
        }
    }
    console.log(bestMatchCategory);
    pastSubmittedWords.push(selectedWords);
    document.getElementById('submit-button').disabled = true;
    if (bestMatchCategory.diff == 0) {
        // If the group of selected words is correct
        // Show the answer group
        var difficultyIndex = SECRET_GROUPS.findIndex(item => item.category == bestMatchCategory.category);
        var answerGroupElement = document.createElement('div');
        answerGroupElement.id = "answer-" + difficultyIndex;
        answerGroupElement.className = "answer-group";
        answerGroupElement.innerHTML =
            '<p class="answer-heading">' + bestMatchCategory.category + '</p>' +
            '<p>' + bestMatchCategory.words.join(", ") + '</p>';
        document.getElementsByClassName('connections-solved')[0].appendChild(answerGroupElement);
        // Remove selected tiles
        Array.from(document.getElementsByClassName('selected')).forEach(function(element) {
            element.remove();
            selectedGroups[element.id].status = Status.CORRECT;
        });
        numRowsLeft--;
        selectedWords = [];
        document.getElementById('deselect-button').disabled = true;
        document.getElementsByClassName('connections-grid')[0].style.gridTemplateRows = "repeat(" + numRowsLeft + ", 1fr)";
        document.getElementsByClassName('connections-grid')[0].style.height = "calc(" + 4 * (numRowsLeft - 1) + "px + " + numRowsLeft + " * 22.5vw)";
    } else {
        numMistakesRemaining--;
        if (numMistakesRemaining < 0) {
            // Game over
            console.log("Game over");
        } else {
            document.getElementById('mistake-' + numMistakesRemaining).style.display = "none";
        }
    }
}

document.getElementById('back-button').addEventListener('click', goBack);
document.getElementById('play-button').addEventListener('click', hideIntroPage);
Array.from(document.getElementsByClassName('connections-tile')).forEach(function(e) {
    addEventListener('click', clickWord);
});
document.getElementById('shuffle-button').addEventListener('click', shuffleWords);
document.getElementById('deselect-button').addEventListener('click', deselectAllWords);
document.getElementById('submit-button').addEventListener('click', submitWords);

initWords();