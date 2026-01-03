const express = require('express');
const path = require('path');
const portNumber = 8080;

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.redirect('index.html');
});

app.get('/mini', function(req, res) {
    res.redirect('games/mini.html');
});

app.get('/wordle', function(req, res) {
    res.redirect('games/wordle.html');
});

app.get('/connections', function(req, res) {
    res.redirect('games/connections.html');
});

app.get('/strands', function(req, res) {
    res.redirect('games/strands.html');
});

app.listen(portNumber);