const fs = require("fs");

const dicPath = "./lesmiserables.txt";
const defaultMin = {"easy": 4, "medium": 6, "hard": 9};
const defaultMax = {"easy": 6, "medium": 8, "hard": 12};
const maxNbOfError = 6;
let words = [];

let word = "";
let knownLetters = [];
let testedLetters = [];
let errors = 0;

(async () => {
    try {
        let fileText = await fs.promises.readFile(dicPath);
        let fileWords = fileText.toString().split(/[(\r?\n),. ]/);
        for (let word of fileWords) {
            let valid = true;
            for (let i = 0; i < word.length; i++) {
                if (word.charCodeAt(i) < 97 || word.charCodeAt(i) > 122) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                for (let i = words.length; i <= word.length; i++) words.push([]);
                words[word.length].push(word);
            }
        }
    } catch (e) {
        console.error("Couldn't read dictionary", e);
    }
})();


async function tryGetWord(url, response, endpoint = "getWord") {
    let difficulty = url.searchParams.get("difficulty") ?? "medium";
    let min = parseInt(url.searchParams.get("minLetters") ?? defaultMin[difficulty]);
    let max = Math.min(parseInt(url.searchParams.get("maxLetters") ?? defaultMax[difficulty]), words.length - 1);

    if (min > max) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "Invalid bounds",
            "hint": "Check if the max length isn't smaller than the min ;)",
            "details": {"endpoint": endpoint, "min": min, "max": max}
        }));
        return false;
    }
    if (min > words.length) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "Invalid bounds",
            "hint": "Your bounds are too high, consider lowering them.",
            "details": {"endpoint": endpoint, "min": min, "max": max, "longest_word": words.length}
        }));
        return false;
    }

    response.statusCode = 200;
    let wordLength = Math.floor(Math.random() * (max - min)) + min;
    return words[wordLength][Math.floor(Math.random() * words[wordLength].length)];
}

async function getWord(url, response){
    let getWordResult = await tryGetWord(url, response);
    if(!getWordResult) return;

    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(getWordResult));
}

async function newGame(url, response) {
    word = await tryGetWord(url, response, "newGame");
    if (!word) return;

    const lettersOfTheWord = word.split('').filter(function (item, pos) {
        return word.indexOf(item) === pos; // On ne garde que la première occurrence de la lettre dans le mot
    }).sort();
    const minNumberOfLetters = Math.max(lettersOfTheWord.length / 3, 1);
    const maxNumberOfLetters = lettersOfTheWord.length / 2;
    const numberOfLetters = Math.floor(Math.max(Math.random() * maxNumberOfLetters, minNumberOfLetters));
    testedLetters = lettersOfTheWord.slice(0,numberOfLetters);
    knownLetters = word.split('').map((item) => testedLetters.includes(item) ? item : " ");
    errors = 0;
    console.log("New game started, word to find: " + word);

    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({
        "message": "New game started",
        "details": {
            "wordLength": word.length,
            "errors": errors,
            "maxErrors": maxNbOfError,
            "testedLetters": testedLetters,
            "known": knownLetters
        }
    }));
}

async function testLetter(url, response) {
    const endpoint = "testLetter";

    if (!word) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "No game running",
            "hint": "You need to start a new game",
            "details": {"endpoint": endpoint, "query": url.searchParams}
        }));
        return;
    }

    const letter = url.searchParams.get("letter")?.toLowerCase();
    if (!letter) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "Missing parameter",
            "hint": "You need to include a letter to test",
            "details": {
                "endpoint": endpoint,
                "letter": letter,
                "errors": errors,
                "maxErrors": maxNbOfError,
                "testedLetters": testedLetters,
                "known": knownLetters
            }
        }));
        return;
    }
    if (letter.charCodeAt(0) < 97 || letter.charCodeAt(0) > 122) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "Invalid letter",
            "hint": "Please only use basic english letters",
            "details": {
                "endpoint": endpoint,
                "letter": letter,
                "errors": errors,
                "maxErrors": maxNbOfError,
                "testedLetters": testedLetters,
                "known": knownLetters
            }
        }));
        return;
    }
    if (testedLetters.includes(letter)) {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "Already tested letter",
            "hint": "If I said that the letter isn't in the word, it ISN'T IN THE WORD ! Stop asking and test a new letter",
            "details": {
                "endpoint": endpoint,
                "letter": letter,
                "found": knownLetters.includes(letter),
                "errors": errors,
                "maxErrors": maxNbOfError,
                "testedLetters": testedLetters,
                "known": knownLetters
            }
        }));
        return;
    }

    testedLetters.push(letter);
    let found = false;
    for (let i = 0; i < word.length; i++) {
        if (word.charAt(i) === letter) {
            knownLetters[i] = letter;
            found = true;
        }
    }
    if (!found) errors++;
    if (errors >= maxNbOfError) {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "Game over",
            "details": {
                "letter": letter,
                "found": found,
                "errors": errors,
                "maxErrors": maxNbOfError,
                "known": knownLetters,
                "testedLetters": testedLetters,
                "word": word
            }
        }));
        word = "";
        return;
    }
    if (!knownLetters.includes(" ")) {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "You've wined",
            "details": {
                "letter": letter,
                "found": found,
                "errors": errors,
                "maxErrors": maxNbOfError,
                "known": knownLetters,
                "testedLetters": testedLetters,
                "word": word
            }
        }));
        word = "";
        return;
    }

    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({
        "message": found ? "Letter found in word" : "Letter not found in word",
        "details": {
            "letter": letter,
            "found": found,
            "errors": errors,
            "maxErrors": maxNbOfError,
            "testedLetters": testedLetters,
            "known": knownLetters
        }
    }));
}

async function manageRequest(request, response) {
    let url = new URL(request.url, `${request.protocol}://${request.headers.host}`);
    let endpoint = url.pathname.substring("/api".length);
    if (endpoint === "/getWord") await getWord(url, response);
    else if (endpoint === "/newGame") await newGame(url, response);
    else if (endpoint === "/testLetter") await testLetter(url, response);
    else {
        response.statusCode = 404;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "No endpoint found",
            "hint": "Check the address",
            "details": {"endpoint": endpoint, "query": url.searchParams}
        }));
    }
}

exports.manage = manageRequest;