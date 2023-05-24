const fs = require("fs");

const dicPath = "./lesmiserables.txt";
const defaultMin = 6;
const defaultMax = 8;

let words = [];

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

async function manageRequest(request, response) {
    let url = new URL(request.url, `${request.protocol}://${request.headers.host}`);
    let endpoint = url.pathname.substring("/api".length);
    let query = url.searchParams;
    if (endpoint === "/getWord") {
        let min = parseInt(query.get("minLetters") ?? defaultMin);
        let max = Math.min(parseInt(query.get("maxLetters") ?? defaultMax), words.length - 1);

        if(min > max) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({
                "message": "Invalid bounds",
                "hint": "Check if the max length isn't smaller than the min ;)",
                "details": {"endpoint": endpoint, "min": min, "max": max}
            }));
            return;
        }
        if(min > words.length) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({
                "message": "Invalid bounds",
                "hint": "Your bounds are too high, consider lowering them.",
                "details": {"endpoint": endpoint, "min": min, "max": max, "longest_word": words.length}
            }));
            return;
        }

        response.statusCode = 200;
        let wordLength = Math.floor(Math.random() * (max - min)) + min;
        console.log(min + ", " + max + ", " + wordLength)
        response.end(words[wordLength][Math.floor(Math.random() * words[wordLength].length)]);
        return;
    }
    response.statusCode = 404;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({
        "message": "No endpoint found",
        "hint": "Check the address",
        "details": {"endpoint": endpoint, "query": query}
    }));
}

exports.manage = manageRequest;