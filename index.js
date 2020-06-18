'use strict'

const express = require('express');
const body_parser = require('body-parser');
const request = require('request');
const http = require('http');
const https = require('https');

const bot = express();

let PORT = (process.env.PORT || 5000);
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;
let API_KEY = process.env.API_KEY;
let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

let PLACE = "";
let PLACE_ID = "";
let PLACE_DETAILS = "";
let PREDICTION = "";

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
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let firstResponse;
    let secondResponse;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'first time user') {
        firstResponse = { "text": `Hello ${{user_first_name}}, welcome to Peek!` };
        secondResponse = { "text": "Where would you like to go?" };
    } else if (payload === 'no') {
        PLACE = "";
        PLACE_ID = "";
        firstResponse = { "text": "Oops, try entering your destination again" };
        secondResponse = { "text": "You can also try the web version of Peek here: \nhttp://safe-peek.ue.r.appspot.com/" };
    }
    // Payload = 'yes'
    else {
        getPrediction().prediction;
        setTimeout(wait, 2000);

        let firstResponse = PLACE + " is currently at its " + PREDICTION + " capacity.";
        let secondResponse = "Consider going to " + PLACE + " at a later time";

        if (PREDICTION == "no populartimes data") {
            firstResponse = "Sorry. There is no data available for this location.";
            secondResponse = "Please stay safe at " + PLACE + " if you really have to go.";
            console.log("no populartimes data:\n", firstResponse);
        } else if (PREDICTION == "lowest" || PREDICTION == "average") {
            secondResponse = "Please stay safe at " + PLACE + " .";
        }
    }

    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, firstResponse);
    callSendAPI(sender_psid, secondResponse);
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
                        "title": "Yes!",
                        "payload": "yes",
                    },
                    {
                        "type": "postback",
                        "title": "No!",
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
        get_place_id(received_message.text);
        setTimeout(wait, 2000);
        if (PLACE_DETAILS) {
            console.log("Place details:", PLACE_DETAILS);
            PLACE = PLACE_DETAILS.name;
            PLACE_ID = PLACE_DETAILS.place_id; //---------------------------------------------------------------------------

            // send postback to validate destination
            if (PLACE) {
                response = `Confirm your destination is ${PLACE}?`;
                sendPostBack(sender_psid, response);
                return;
            }
        } else {
            response = { "text": "Please enter a valid input" }
        }
    } else {
        response = { "text": "Please enter a valid input" }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);

};

// Extract place ID using Google Places API
function get_place_id(search_string) {
    search_string = search_string.split(" ").join("%20");

    let PLACE_API_ENDPOINT = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${search_string}&inputtype=textquery&fields=formatted_address,name,place_id&key=${API_KEY}`;
    https.get(PLACE_API_ENDPOINT, resp => {
        let data = "";

        resp.on('data', chunk => {
            data += chunk;
        });

        resp.on('end', () => {
            let place_data = JSON.parse(data);
            PLACE_DETAILS = place_data.candidates[0];
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
            PREDICTION = result.prediction;
        });
    }).on('error', err => {
        console.log("[ERROR]: " + err.message);
    })
};

function wait() {
    console.log("Waited 2 seconds for a function to execute");
};

bot.listen(bot.get('port'), function() {
    console.log("running on port:", PORT);
});