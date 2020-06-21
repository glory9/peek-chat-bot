function get_place_id(search_string) {
    for (let i = 0; i < 20000000; i += 2) {
        i -= 1;
    };
    return "A promise that actually works. \nUsing this to practice js promises."
};

function pprint(x) {
    console.log(x);;
}

function getPrediction() {
    let promise = new Promise((resolve, reject) => {
        resolve(get_place_id());
    }).then(value => {
        pprint(value);
    }).catch(e => {
        console.error(e);
    });

};

getPrediction();