const ADVENT_DAYS = 12;
const NUM_EXPIRATION_DAYS = 30;
const GREETINGS_PATH = "txt/greetings.txt";
const GAME_CARDS = [
  { id: 'the-mini', image: "/img/mini.svg" },
  { id: 'wordle', image: "/img/wordle.svg" },
  { id: 'connections', image: "/img/connections.svg" },
  { id: 'strands', image: "/img/strands.svg" },
];

/* Returns the value of the given cookie name. */
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

/* Sets the cookie given the name, value, and expiration days. */
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

/* Removes the given name from the cookie. */
function deleteCookie(name, path, domain) {
    // Set an expiration date in the past
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT;" +
                      // Include path and domain if specified, otherwise default path to '/'
                      (domain ? "; domain=" + domain : "") +
                      (path ? "; path=" + path : "; path=/");
}

/* Returns true if the two dates are the same. */
function isSameDay(original_date, new_date) {
  return original_date.getFullYear() === new_date.getFullYear() &&
          original_date.getMonth() === new_date.getMonth() &&
          original_date.getDate() === new_date.getDate()
}

/* Deletes all game states. */
function deleteGameState() {
  deleteCookie("date");
  deleteCookie("mini-game-state");
  deleteCookie("mini-seconds-passed");
  deleteCookie("mini-submitted-grid");
  deleteCookie("wordle-game-state");
  deleteCookie("wordle-submitted-words");
  deleteCookie("strands-game-state");
  deleteCookie("strands-submitted-indices");
  deleteCookie("strands-submitted-word-indices");
  deleteCookie("connections-game-state");
  deleteCookie("connections-submitted-words");
}

function loadCookies() {
  // Check today's date
  let startDate = getCookie("start-date");
  if (startDate != "") {
    // If the advent calendar is started, compare today's date with the start date to see if the day has advanced
    const start_date = new Date(startDate);
    const current_date = new Date();
    if (!isSameDay(start_date, current_date)) {
      // Increase the day number by the difference in the last saved date and today's date
      const difference = current_date.getDate() - start_date.getDate();
      deleteCookie("day"); // jic
      setCookie("day", difference + 1, NUM_EXPIRATION_DAYS);
      let saved_date = new Date(getCookie("date"));
      if (!isSameDay(saved_date, current_date)) {
        // Also delete every game state if no game has been started today
        deleteGameState();
      }
    }
  } else {
    // If the advent calendar is not started, set the day number to 1
    deleteCookie("day"); // jic
    setCookie("day", 1, NUM_EXPIRATION_DAYS);
    setCookie("start-date", new Date(), NUM_EXPIRATION_DAYS);
    // Also set every game stat to zero
    deleteGameState();
    setCookie("mini-num-played", 0, NUM_EXPIRATION_DAYS);
    setCookie("mini-win-percentage", 0, NUM_EXPIRATION_DAYS);
    setCookie("mini-win-streak", 0, NUM_EXPIRATION_DAYS);
    setCookie("mini-win-streak-max", 0, NUM_EXPIRATION_DAYS);
    setCookie("wordle-num-played", 0, NUM_EXPIRATION_DAYS);
    setCookie("wordle-win-percentage", 0, NUM_EXPIRATION_DAYS);
    setCookie("wordle-win-streak", 0, NUM_EXPIRATION_DAYS);
    setCookie("wordle-win-streak-max", 0, NUM_EXPIRATION_DAYS);
    setCookie("wordle-win-distribution", [0,0,0,0,0,0], NUM_EXPIRATION_DAYS);
    setCookie("strands-num-played", 0, NUM_EXPIRATION_DAYS);
    setCookie("strands-win-percentage", 0, NUM_EXPIRATION_DAYS);
    setCookie("strands-win-streak", 0, NUM_EXPIRATION_DAYS);
    setCookie("strands-win-streak-max", 0, NUM_EXPIRATION_DAYS);
    setCookie("connections-num-played", 0, NUM_EXPIRATION_DAYS);
    setCookie("connections-win-percentage", 0, NUM_EXPIRATION_DAYS);
    setCookie("connections-win-streak", 0, NUM_EXPIRATION_DAYS);
    setCookie("connections-win-streak-max", 0, NUM_EXPIRATION_DAYS);
  }
}

/* Returns whether the current time is morning, afternoon, or evening. */
function getTimeOfDay() {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  let timeOfDay;

  if (currentHour < 12) {
    timeOfDay = "morning";
  } else if (currentHour < 17) {
    timeOfDay = "afternoon";
  } else {
    timeOfDay = "evening";
  }
  return timeOfDay;
}

/* Returns the day of the week of the given date. */
function getDayOfWeek(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/* Returns the day of the week and date of the given date. */
function getDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

/* Returns the month, day, and year of the given date. */
function getFullDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function initAdvent() {
  loadCookies();
  let day = Number(getCookie("day"));

  // Load today's caption
  if (document.getElementById('greetings')) {
    // Read the greetings.txt file
    const response = fetch(GREETINGS_PATH)
      .then(response => response.text())
      .then(data => {
          const itemsArray = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
          const greeting = itemsArray[day - 1];
          document.getElementById('greetings').innerHTML = "Good " + getTimeOfDay() + "!";
          document.getElementById('greetings-caption').innerHTML = greeting;
      });
  }
  
  // Load the advent progress bar
  document.getElementById('ereyesterday-number').innerHTML = day - 2;
  document.getElementById('yesterday-number').innerHTML = day - 1;
  document.getElementById('today-number').innerHTML = day;
  document.getElementById('final-number').innerHTML = ADVENT_DAYS;
  if (day < 3) {
    document.querySelector('.advent-progress-bar .progress-bubbles .bubbles .bubble:nth-child(1)').style.visibility = "hidden";
    document.querySelector('.advent-progress-bar .days .day:nth-child(1)').style.visibility = "hidden";
  }
  if (day < 2) {
    document.querySelector('.advent-progress-bar .progress-bubbles .bubbles .bubble:nth-child(2)').style.visibility = "hidden";
    document.querySelector('.advent-progress-bar .days .day:nth-child(2)').style.visibility = "hidden";
  }

  // Load the game cards
  var today = getDate(new Date());
  Array.from(document.querySelectorAll('.main-card .card-link.date')).forEach(function(element) {
    element.innerHTML = today;
  });

  // Load the locked game cards for the number of days left
  var numDaysLeft = ADVENT_DAYS - day;
  for (var gameCard of GAME_CARDS) {
    var gameContainerElement = document.getElementById(gameCard.id);
    var tomorrowDate = new Date();
    for (var i = 0; i < numDaysLeft; i++) {
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      var tomorrow = getDayOfWeek(tomorrowDate);
      var thumbnailCard = document.createElement('div');
      thumbnailCard.classList = "card thumbnail-card";
      thumbnailCard.id = gameCard.id + "-card";
      thumbnailCard.innerHTML = 
              '<span class="position-absolute top-0 start-0 translate-middle badge rounded-pill text-bg-light">' + 
                  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-lock-fill" viewBox="0 0 16 16">' + 
                      '<path fill-rule="evenodd" d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4m0 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3"/>' + 
                  '</svg>' + 
                  '<span class="visually-hidden">locked</span>' + 
              '</span>' + 
              '<div class="card-body">' + 
                  '<div class="card-body-description">' + 
                      '<img src=/>' + 
                  '</div>' + 
                  '<span class="card-link date">' + tomorrow + '</span>' + 
              '</div>';
      gameContainerElement.appendChild(thumbnailCard);
    }
    // Must manually update the src property of the thumbnail images
    document.querySelectorAll("#" + gameCard.id + " .thumbnail-card .card-body .card-body-description img").forEach(function(element) {
      element.src = gameCard.image;
    });
  }
}

/* Resets all game progress and start date. */
function resetAdvent() {
  if (confirm('Are you sure you want to reset the advent calendar? You will start from Day 1.')) {
    // Yes
    deleteCookie("start-date");
    deleteCookie("date");
    deleteCookie("day");
    deleteGameState();
    deleteCookie("mini-num-played");
    deleteCookie("mini-win-percentage");
    deleteCookie("mini-win-streak");
    deleteCookie("mini-win-streak-max");
    deleteCookie("wordle-num-played");
    deleteCookie("wordle-win-percentage");
    deleteCookie("wordle-win-streak");
    deleteCookie("wordle-win-streak-max");
    deleteCookie("wordle-win-distribution");
    deleteCookie("strands-num-played");
    deleteCookie("strands-win-percentage");
    deleteCookie("strands-win-streak");
    deleteCookie("strands-win-streak-max");
    deleteCookie("connections-num-played");
    deleteCookie("connections-win-percentage");
    deleteCookie("connections-win-streak");
    deleteCookie("connections-win-streak-max");
    window.location.reload();
  }
  // Otherwise, do nothing
}

function goToMiniGame() {
  window.open('/mini', '_self');
}

function goToWordleGame() {
  window.open('/wordle', '_self');
}

function goToConnectionsGame() {
  window.open('/connections', '_self');
}

function goToStrandsGame() {
  window.open('/strands', '_self');
}

/* Add click functions to the main game cards */
if (document.getElementById('the-mini-card')) {
    document.getElementById('the-mini-card').addEventListener('click', goToMiniGame);
}
if (document.getElementById('wordle-card')) {
    document.getElementById('wordle-card').addEventListener('click', goToWordleGame);
}
if (document.getElementById('connections-card')) {
    document.getElementById('connections-card').addEventListener('click', goToConnectionsGame);
}
if (document.getElementById('strands-card')) {
    document.getElementById('strands-card').addEventListener('click', goToStrandsGame);
}
if (document.getElementById('reset-button')) {
    document.getElementById('reset-button').addEventListener('click', resetAdvent);
}

initAdvent();