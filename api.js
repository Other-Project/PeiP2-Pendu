const Game = require("./game");

let sessions = {};

async function getWord(url, response) {
    let min = parseInt(url.searchParams.get("minLetters") ?? 6);
    let max = parseInt(url.searchParams.get("maxLetters") ?? Math.max(min, 8));
    try {
        let getWordResult = await Game.getWord(min, max);

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(getWordResult));
    } catch (e) {
        if (e.sender !== "Game") throw e;
        response.statusCode = e.status;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": e.message,
            "hint": e.hint,
            "details": {"endpoint": "getWord", ...e.details}
        }));
    }
}

async function newGame(url, response) {
    try {
        let difficulty = url.searchParams.get("difficulty") ?? "medium";
        let game = new Game(difficulty);
        sessions[game.id] = game;

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": "New game started",
            "details": {
                "session": game.id,
                "wordLength": game.word.length,
                "status": "playing",
                "errors": game.errors,
                "maxErrors": game.maxNbOfError,
                "testedLetters": game.testedLetters,
                "known": game.knownLetters
            }
        }));
    } catch (e) {
        if (e.sender !== "Game") throw e;
        response.statusCode = e.status;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": e.message,
            "hint": e.hint,
            "details": {"endpoint": "newGame", ...e.details}
        }));
    }
}

async function testLetter(url, response) {
    const endpoint = "testLetter";
    const session = url.searchParams.get("session");

    if (!(session in sessions)) {
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
    const game = sessions[session];

    try {
        const found = game.testLetter(letter);

        if (found && game.hasWon()) {
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({
                "message": "You've won",
                "details": {
                    "letter": letter,
                    "found": found,
                    "status": "won",
                    "errors": game.errors,
                    "maxErrors": game.maxNbOfError,
                    "testedLetters": game.testedLetters,
                    "known": game.knownLetters,
                    "word": game.word
                }
            }));
            delete sessions[session];
            return;
        } else if (!found && game.hasLost()) {
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({
                "message": "Game over",
                "details": {
                    "letter": letter,
                    "found": found,
                    "status": "lost",
                    "errors": game.errors,
                    "maxErrors": game.maxNbOfError,
                    "testedLetters": game.testedLetters,
                    "known": game.knownLetters,
                    "word": game.word
                }
            }));
            delete sessions[session];
            return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": found ? "Letter found in word" : "Letter not found in word",
            "details": {
                "letter": letter,
                "found": found,
                "status": "playing",
                "errors": game.errors,
                "maxErrors": game.maxNbOfError,
                "testedLetters": game.testedLetters,
                "known": game.knownLetters
            }
        }));
    } catch (e) {
        if (e.sender !== "Game") throw e;
        response.statusCode = e.status;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
            "message": e.message,
            "hint": e.hint,
            "details": {
                "endpoint": "testLetter",
                "letter": letter,
                "found": false,
                "errors": game.errors,
                "maxErrors": game.maxNbOfError,
                "testedLetters": game.testedLetters,
                "known": game.knownLetters,
                ...e.details}
        }));
    }
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