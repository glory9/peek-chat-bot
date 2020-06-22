# peek-chat-bot
- Chat bot interface for Peek. Peek helps people stay safe by avoiding crowded places.
- Refer to Peek App for more information - https://github.com/glory9/peek-app

## How It Works
- This repository is hosted on heroku and connected to a facebook app which is also linked to Peek's Facebook page.
- Users can access the bot through Peek Facebook page in messenger.
- Messages are sent/recieved via the Messenger webhook API defined inside the `node.js` server
- A one-time notification is sent 24 hours after the user's last interaction with the bot (If the user subscribes to one-time notifications). The notification essentially reminds the user to use Peek to check out their destination (this is geared towards helping the user build a habit of using peek)




## Technologies Used
- Peek API (Built by me using populartimes API)
- send API
- messages API
- messaging_postbacks API
- one-time notifications API
- Node.js
- Express.js

## What I learned
- Using environment variables
- Javscript async functions
- Javascript promises
- Messenger bot developmemt

## Try it out here
http://m.me/104662897961170

or 

Search for "Peek" in Facebook Messenger and click on "Get Started".

View on devpost: https://devpost.com/software/peek-chatbot
