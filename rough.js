// let test = "";

// function get_place_id() {
//     let t = 0
//     for (let i = 0; i < 200000000; i += 2) {
//         i -= 1;
//         t = i;
//     };
//     return t - 200000000; //"A promise that actually works. \nUsing this to practice js promises."
// };

// function pprint(x) {
//     console.log(x);;
// }

// function getPrediction() {
//     let promise = new Promise((resolve, reject) => {
//         console.log("x is-", test);
//         test = get_place_id();
//         console.log("x is-", test);
//         resolve(test);
//     }).then(value => {
//         pprint(value);
//         console.log("x is-", test);
//     }).catch(e => {
//         console.error(e);
//     });
// };

// let opo = Promise.resolve(null);
// opo.then(value => {
//     console.log("Opoluma on the beat");
// });

// getPrediction();

let list = {
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
    ]
}

list.buttons.forEach(element => {
    console.log(element.title);
});


if (list.buttons.length > 0) {
    console.log("List\ncame out True".split("\n")[0])
}