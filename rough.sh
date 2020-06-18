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
}' "https://graph.facebook.com/v7.0/me/messenger_profile?access_token=EAAD1vUUipicBAAgoASWGSYGGx6b3exxjM12hUiE61pgU1qMzf1isXPWdN6STo2u417brWKezcFJSHLuC84o6V83BTLPYhyqawJAmLa4k1CkV9jThU581R3FGYQo78QMCG3jdb6SZADGjEZBMEFb2j2T5k8DbY8ZCmZBdHy11IGBzaEowqlFH"
