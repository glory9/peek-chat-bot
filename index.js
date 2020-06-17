'use strict'

const express = require('express');
const body_parser = require('body-parser');
const request = require('request');

const bot = express();

bot.set('port', (process.env.PORT || 5000));
bot.use(body_parser.urlencoded({ extended: false }));
bot.use(body_parser.json());

bot.get('/', function(req, res) {
    res.send("Welcome to Peek's FaceBook Chatbot App")
});

bot.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "thispeekbot") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
})

bot.listen(bot.get('port'), function() {
    console.log("running: port")
});