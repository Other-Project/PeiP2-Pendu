let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let discoveredLetters = [];

function populateKeyboard() {
    let clavier = document.getElementById("clavier");
    let oldLetters = document.getElementsByClassName("lettreClavier");
    while (oldLetters.length)
        oldLetters[0].remove();
    let lettreClavierTemplate = document.getElementById("lettreClavier-template");
    for (let lettre of alphabet) {
        let lettreClavier = document.importNode(lettreClavierTemplate.content, true);
        lettreClavier.querySelector("span").innerText = lettre;
        let lettreClavierBtn = lettreClavier.querySelector("button");
        lettreClavierBtn.id = "clavier-" + lettre;
        lettreClavierBtn.dataset.letter = lettre;
        if (discoveredLetters.includes(lettre)) lettreClavierBtn.classList.add("good");
        else lettreClavierBtn.addEventListener("click", function () {
            testLetter(this);
        });
        clavier.appendChild(lettreClavier);
    }
}

function writeWord(details) {
    let mot = document.getElementById("mot");

    let oldLetters = mot.getElementsByClassName("lettre");
    while (oldLetters.length)
        oldLetters[0].remove();

    let lettreTemplate = document.getElementById("lettre-template");
    for (let character of details["known"]) {
        let lettre = document.importNode(lettreTemplate.content, true);
        lettre.querySelector("span").innerText = character;
        mot.appendChild(lettre);
    }
}

function checkVictoryAndDefeat(response) {
    let win = response["message"] === "You've wined";
    let loose = response["message"] === "Game over";
    if (!win && !loose) return;

    let message = document.getElementById("message");
    message.classList.remove("notDisplayed");
    message.innerText = win ? "Vous avez gagné" : "Vous avez perdu, le mot était " + response["details"]["word"];
    let playBtn = document.getElementById("jouer");
    playBtn.classList.remove("notDisplayed");
    playBtn.innerText = "Rejouer";

    for (let letter of document.getElementsByClassName("lettreClavier"))
        letter.setAttribute("disabled", true);
}

async function testLetter(btn) {
    // We check that the data-letter attribute is valid (a letter of the alphabet)
    if (!alphabet.includes(btn.dataset.letter)) {
        // We reset the keyboard.
        // By doing this, the current state of the keyboard is lost. But no one will change the DOM right?
        populateKeyboard();

        console.error("You've changed the DOM, cheater ! The keyboard has been reset.");
        return;
    }
    if (btn.hasAttribute("disabled")) return;

    let response = await fetchAsync("/api/testLetter?letter=" + btn.dataset.letter);
    if (response["details"]["found"]) {
        console.log(btn.dataset.letter + " is in the word", discoveredLetters);
        btn.classList.add("good");
    } else {
        console.log(btn.dataset.letter + " isn't in the word");
        btn.classList.add("wrong");
        document.querySelector("#pendu > .notDisplayed").classList.remove("notDisplayed");
    }
    btn.setAttribute("disabled", true);
    writeWord(response["details"]);
    updateStats(response["details"]);
    checkVictoryAndDefeat(response);
}

function generateStartingPoint() {
    const minNumberOfLetters = Math.max(lettersOfTheWord.length / 3, 1);
    const maxNumberOfLetters = lettersOfTheWord.length / 2;
    const numberOfLetters = Math.floor(Math.max(Math.random() * maxNumberOfLetters, minNumberOfLetters));
    console.log("Generating " + numberOfLetters + " letter(s) in " + lettersOfTheWord);
    for (let i = 0; i < numberOfLetters; i++) {
        let letter = lettersOfTheWord[Math.floor(Math.random() * lettersOfTheWord.length)];
        if (!discoveredLetters.includes(letter)) discoveredLetters.push(letter);
    }
}

function updateStats(details) {
    document.getElementById("nbErreur").innerText = details["errors"];
    document.getElementById("essaisRestants").innerText = (details["maxErrors"] - details["errors"]).toString();
}

async function fetchAsync(url) {
    let message = document.getElementById("message");
    message.classList.remove("notDisplayed");
    message.innerText = "En attente du serveur";
    let response = await fetch(url);
    if (!response.ok) return await fetchAsync(url);
    let mot = await response.text();
    message.classList.add("notDisplayed");
    return JSON.parse(mot);
}

async function newGame() {
    let elementToBeDisplayed = document.getElementsByClassName("notDisplayed");
    while (elementToBeDisplayed.length)
        elementToBeDisplayed[0].classList.remove("notDisplayed");
    document.getElementById("jouer").classList.add("notDisplayed");
    document.getElementById("message").classList.add("notDisplayed");
    for (let partiePendu of document.getElementsByClassName("perso"))
        partiePendu.classList.add("notDisplayed");

    let response = await fetchAsync("/api/newGame");
    /*lettersOfTheWord = word.split('').filter(function (item, pos) {
        return word.indexOf(item) === pos; // On ne garde que la première occurrence de la lettre dans le mot
    }).sort();
    errors = 0;
    maxNbOfError = document.getElementsByClassName("perso").length;*/
    discoveredLetters = response["details"]["known"];
    updateStats(response["details"]);
    //generateStartingPoint();
    populateKeyboard();
    writeWord(response["details"]);
}

document.getElementById("jouer").addEventListener("click", newGame);

// Shortcuts
document.addEventListener('keydown', async function (event) {
    if (event.key === "Enter") {
        let playBtn = document.getElementById("jouer");
        if (!playBtn.classList.contains("notDisplayed")) await newGame();
    }

    let letter = event.key.toUpperCase();
    if (alphabet.includes(letter)) {
        document.getElementById("clavier-" + letter).classList.add("active");
    }
});
document.addEventListener('keyup', function (event) {
    let letter = event.key.toUpperCase();
    if (alphabet.includes(letter)) {
        let keyOnKeyboard = document.getElementById("clavier-" + letter);
        keyOnKeyboard.classList.remove("active");
        testLetter(keyOnKeyboard);
    }
});

// Theme
document.documentElement.addEventListener("theme-changed", (e) => document.getElementById("theme").innerText = e.detail.dark ? "☀" : "🌙");
document.getElementById("theme").addEventListener("click", () => changeTheme(document.documentElement.dataset.theme === "light"));

// "Anti-cheat"
window.addEventListener('devtoolschange', event => {
    if (event.detail.isOpen) console.warn("La console a été ouverte, j'ose espérer que ce n'est pas pour tricher !");
});
