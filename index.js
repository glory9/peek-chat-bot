'use strict'

const express = require('express');
const body_parser = require('body-parser');
const request = require('request');
const http = require('http');
const https = require('https');
const { rejects } = require('assert');
const { resolve } = require('path');

const bot = express();

let PORT = (process.env.PORT || 5000);
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;
let API_KEY = process.env.API_KEY;
let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

let PLACE = "";
let PLACE_ID = "";
let place_info = "";
let prediction = "";

bot.set('port', PORT);
bot.use(body_parser.urlencoded({ extended: false }));
bot.use(body_parser.json());

bot.get('/', function(req, res) {
    res.send("Welcome to Peek's FaceBook Chatbot App")
});

// Adds support for GET requests to our webhook
bot.get('/webhook', (req, res) => {
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// Creates the endpoint for our webhook 
bot.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Gets the body of the webhook event
        let webhook_event = body.entry[0].messaging[0];
        console.log('Message:', webhook_event);

        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);
        } else if (webhook_event.postback) {
            handlePostback(sender_psid, webhook_event.postback);
        } else if (webhook_event.optin && webhook_event.optin.type == "one_time_notif_req") {
            confirmOneTime(sender_psid, webhook_event.optin.one_time_notif_token);
        }

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('[message sent!]--', response);
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let firstResponse;
    let secondResponse;
    let isReminder = false;
    let reminder = "";

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'first time user') {
        isReminder = true;
        firstResponse = { "text": "Hello, welcome to Peek!" };
        secondResponse = { "text": "Where would you like to go?" };
        reminder = {
            "text": "Peek Reminder alerts you to check out your destination before heading out. Would you like to try it out?",
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "one_time_notif_req",
                    "title": "Remind me",
                    "payload": "peek-reminder"
                }
            }
        };
    } else if (payload === 'no') {
        PLACE = "";
        PLACE_ID = "";
        firstResponse = { "text": "Oops, try entering your destination again" };
        secondResponse = { "text": "You can also try the web version of Peek here: \nhttp://safe-peek.ue.r.appspot.com/" };
    }
    // Payload = 'yes'
    else {
        setTimeout(sendPrediction, 2000);
        getPrediction();

        function sendPrediction() {
            firstResponse = PLACE + " is currently at its " + prediction + " capacity.";
            secondResponse = "Consider going to " + PLACE + " at a later time";

            if (prediction == "no populartimes data") {
                firstResponse = "Sorry. There is no data available for this location.";
                secondResponse = "Please stay safe at " + PLACE + " if you really have to go.";
                console.log("no populartimes data:\n");
            } else if (prediction == "lowest" || prediction == "average") {
                secondResponse = "Please stay safe at " + PLACE + ".";
            };

            firstResponse = { "text": firstResponse };
            callSendAPI(sender_psid, firstResponse);
            secondResponse = { "text": secondResponse };
            callSendAPI(sender_psid, secondResponse);
        }
        return;
    }

    // Send the message to acknowledge the postback
    let respond = Promise.resolve(null);
    respond.then(x => {
        callSendAPI(sender_psid, firstResponse);
    }).then(x => {
        callSendAPI(sender_psid, secondResponse);
    });
    if (isReminder) {
        respond.then(x => {
            callSendAPI(sender_psid, reminder);
        });
    }
};

// Send a postback to confirm user's destination
function sendPostBack(sender_psid, response) {
    let info = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": response,
                "buttons": [{
                        "type": "postback",
                        "title": "Yes",
                        "payload": "yes",
                    },
                    {
                        "type": "postback",
                        "title": "No",
                        "payload": "no",
                    }
                ],
            }
        }
    };

    callSendAPI(sender_psid, info);
};

// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {

        // Create the payload for a basic text message
        setTimeout(confirm_message, 2000);
        get_place_info(received_message.text);

        function confirm_message() {
            if (place_info != null) {
                console.log("Place details:", place_info);
                PLACE = place_info.name;
                PLACE_ID = place_info.place_id;

                // send postback to validate destination
                response = `Confirm your destination is ${PLACE}?`;
                sendPostBack(sender_psid, response);
            }
            // Figured it will be more natural ignore invalid text inputs
            // else {
            //     console.log("\n[ERROR]: No place info returned.\n");
            //     response = { "text": `Oops. No data for ${received_message.text}.\nPlease Check the input and try again.` };
            //     callSendAPI(sender_psid, response);
            // }
        }
    } else {
        response = { "text": "Please enter a valid input" };
        callSendAPI(sender_psid, response);
    }
};

function confirmOneTime(sender_psid, one_time_token) {
    // store sender id and token in Mongo DB
    let word = { "text": "[SUCCESS] - Peek Reminder Enabled Successfully!" }
    callSendAPI(sender_psid, word);
};

// Extract place ID using Google Places API
function get_place_info(search_string) {
    search_string = search_string.split(" ").join("%20");

    let PLACE_API_ENDPOINT = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${search_string}&inputtype=textquery&fields=formatted_address,name,place_id&key=${API_KEY}`;
    https.get(PLACE_API_ENDPOINT, resp => {
        let data = "";

        resp.on('data', chunk => {
            data += chunk;
        });

        resp.on('end', () => {
            let place_data = JSON.parse(data);
            if (place_data.candidates) {
                place_info = place_data.candidates[0];
            }
        });
    }).on('error', err => {
        console.log("[ERROR]: " + err.message);
    })
};

function getPrediction() {
    let PEEK_API_ENDPOINT = `http://safe-peek.ue.r.appspot.com/predict/${API_KEY}/${PLACE_ID}`;
    http.get(PEEK_API_ENDPOINT, resp => {
        let data = "";

        resp.on('data', chunk => {
            data += chunk;
        });

        resp.on('end', () => {
            let result = JSON.parse(data);
            prediction = result.prediction;
        });
    }).on('error', err => {
        console.log("[ERROR]: " + err.message);
    });
};



bot.listen(bot.get('port'), function() {
    console.log("running on port:", PORT);
});