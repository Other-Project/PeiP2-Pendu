const uuid = require("uuid");
const fs = require("fs");

const dicPath = "./dico.txt"; //"./lesmiserables.txt";
const defaultMin = {"easy": 4, "medium": 6, "hard": 9};
const defaultMax = {"easy": 6, "medium": 8, "hard": 12};
const maxNbOfError = 6;
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

class ErrorWithDetails extends Error {
    constructor(message, hint, details, status) {
        super(message);
        this.sender = "Game";
        this.hint = hint;
        this.details = details;
        this.status = status;
    }
}

module.exports = class Game {
    constructor(difficulty) {
        this.id = uuid.v4();
        this.word = Game.getWord(defaultMin[difficulty], defaultMax[difficulty]);

        const lettersOfTheWord = this.word.split('').filter((item, pos) => {
            return this.word.indexOf(item) === pos; // On ne garde que la première occurrence de la lettre dans le mot
        }).sort();
        const minNumberOfLetters = Math.max(lettersOfTheWord.length / 3, 1);
        const maxNumberOfLetters = lettersOfTheWord.length / 2;
        const numberOfLetters = Math.floor(Math.max(Math.random() * maxNumberOfLetters, minNumberOfLetters));
        this.testedLetters = lettersOfTheWord.slice(0, numberOfLetters);
        this.knownLetters = this.word.split('').map((item) => this.testedLetters.includes(item) ? item : " ");
        this.errors = 0;
        this.maxNbOfError = maxNbOfError;
        console.log(`New game started (${this.id}), word to find: ${this.word}`);
    }

    static getWord(min, max) {
        if (min > words.length)
            throw new ErrorWithDetails("Invalid bounds",
                "Your bounds are too high, consider lowering them.",
                {"min": min, "max": max, "longest_word": words.length}, 400);
        if (min > max)
            throw new ErrorWithDetails("Invalid bounds",
                "Check if the max length isn't smaller than the min (i'm not saying that because it's the case ;) )",
                {"min": min, "max": max}, 400);
        max = Math.min(max, words.length - 1);

        let wordLength = Math.floor(Math.random() * (max - min)) + min;
        return words[wordLength][Math.floor(Math.random() * words[wordLength].length)];
    }

    testLetter(letter) {
        if (!letter)
            throw new ErrorWithDetails("Missing parameter", "You need to include a letter to test", {"status": "playing"}, 400);
        if (letter.charCodeAt(0) < 97 || letter.charCodeAt(0) > 122)
            throw new ErrorWithDetails("Invalid letter", "Please only use basic english letters", {"status": "playing"}, 400);
        if (this.testedLetters.includes(letter))
            throw new ErrorWithDetails("Already tested letter",
                "If I said that the letter isn't in the word, it ISN'T IN THE WORD ! Stop asking and test a new letter",
                {"status": "playing"}, 200);

        this.testedLetters.push(letter);
        let found = false;
        for (let i = 0; i < this.word.length; i++) {
            if (this.word.charAt(i) === letter) {
                this.knownLetters[i] = letter;
                found = true;
            }
        }
        if (!found) this.errors++;
        return found;
    }

    hasLost() {
        return this.errors >= maxNbOfError;
    }

    hasWon() {
        return !this.knownLetters.includes(" ");
    }
}