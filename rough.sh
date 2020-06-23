curl -X POST -H "Content-Type: application/json" -d '{
    "greeting":[
  {
    "locale":"default",
    "text":"Peek Helps You Stay Safe By Avoiding Crowded Places"
  }
],
    { 
  "get_started":{
    "payload":"first time user"
  }
}
}' "https://graph.facebook.com/v7.0/me/messenger_profile?access_token=""
