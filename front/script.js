let alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
let sessionId;

function populateKeyboard(discoveredLetters = []) {
    let clavier = document.getElementById("clavier");
    let oldLetters = document.getElementsByClassName("lettreClavier");
    while (oldLetters.length)
        oldLetters[0].remove();

    let lettreClavierTemplate = document.getElementById("lettreClavier-template");
    for (let lettre of alphabet) {
        let lettreClavier = document.importNode(lettreClavierTemplate.content, true);
        lettreClavier.querySelector("span").innerText = lettre.toUpperCase();
        let lettreClavierBtn = lettreClavier.querySelector("button");
        lettreClavierBtn.id = "clavier-" + lettre;
        lettreClavierBtn.dataset.letter = lettre;
        if (discoveredLetters.includes(lettre)) lettreClavierBtn.classList.add("good");
        else lettreClavierBtn.addEventListener("click", async function () {
            await testLetter(this);
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
        lettre.querySelector("span").innerText = character.toUpperCase();
        mot.appendChild(lettre);
    }
}

function checkVictoryAndDefeat(response) {
    if (response["details"]["status"] === "playing") return;

    let message = document.getElementById("message");
    message.classList.remove("notDisplayed");
    message.innerText = {
        "won": "Vous avez gagné",
        "lost": "Vous avez perdu, le mot était " + response["details"]["word"]
    }[response["details"]["status"]] ?? response["message"];

    if (response["details"]["status"] !== "won" && response["details"]["status"] !== "lost") return;
    document.getElementById("jouer").classList.remove("notDisplayed");
    document.getElementById("playTxt").innerText = "Rejouer";
    for (let letter of document.getElementsByClassName("lettreClavier"))
        letter.setAttribute("disabled", true);
    sessionId = null;
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

    let response = await fetchAsync(`/api/testLetter?session=${sessionId}&letter=${btn.dataset.letter}`);
    if (!response) return; // Request has failed, do nothing
    checkVictoryAndDefeat(response);
    if (response["code"] >= 400) return;

    if (response["details"]["found"]) {
        console.log(btn.dataset.letter + " is in the word", response["details"]["known"]);
        btn.classList.add("good");
    } else {
        console.log(btn.dataset.letter + " isn't in the word");
        btn.classList.add("wrong");
        document.querySelector("#pendu > .notDisplayed").classList.remove("notDisplayed");
    }
    btn.setAttribute("disabled", true);
    writeWord(response["details"]);
    updateStats(response["details"]);
}

function updateStats(details) {
    document.getElementById("nbErreur").innerText = details["errors"];
    document.getElementById("essaisRestants").innerText = (details["maxErrors"] - details["errors"]).toString();
}

async function fetchAsync(url, retryCount = 3) {
    if (retryCount <= 0) {
        console.error("Retry count exceeded");
        return null;
    }
    let message = document.getElementById("message");
    message.classList.remove("notDisplayed");
    message.innerText = "En attente du serveur";
    let response = await fetch(url);
    if (!response.ok && response.status >= 500) {  // Only retry if the error is server-side, because for a client-side error, retrying won't fix anything
        console.error(`Request errored, retrying (${retryCount--} attempt(s) remaining)`);
        return await fetchAsync(url, retryCount);
    } else if (!response.ok) console.warn(`Invalid request`);
    let responseBody = JSON.parse(await response.text());
    responseBody["code"] = response.status;
    message.classList.add("notDisplayed");
    return responseBody;
}

async function newGame() {
    let difficulty = document.getElementById("playBtn").dataset.difficulty;
    let response = await fetchAsync(`/api/newGame?difficulty=${difficulty}`);
    if (!response) return; // Request has failed, do nothing

    sessionId = response["details"]["session"];
    let elementToBeDisplayed = document.getElementsByClassName("notDisplayed");
    while (elementToBeDisplayed.length)
        elementToBeDisplayed[0].classList.remove("notDisplayed");
    document.getElementById("jouer").classList.add("notDisplayed");
    document.getElementById("message").classList.add("notDisplayed");
    for (let partiePendu of document.getElementsByClassName("perso"))
        partiePendu.classList.add("notDisplayed");

    updateStats(response["details"]);
    populateKeyboard(response["details"]["known"]);
    writeWord(response["details"]);
}

let playBtn = document.getElementById("playBtn");
playBtn.addEventListener("click", newGame);
for (let difficultyBtn of document.querySelectorAll("#jouer .dropdown button")) {
    difficultyBtn.addEventListener("click", () => {
        playBtn.dataset.difficulty = difficultyBtn.dataset.difficulty;
        document.getElementById("selectedDifficulty").innerText = difficultyBtn.innerText;
    });
}

// Shortcuts
document.addEventListener('keydown', async function (event) {
    if (event.key === "Enter") {
        let playBtn = document.getElementById("jouer");
        if (!playBtn.classList.contains("notDisplayed")) await newGame();
    }

    let letter = event.key.toLowerCase();
    if (alphabet.includes(letter)) {
        document.getElementById("clavier-" + letter).classList.add("active");
    }
});
document.addEventListener('keyup', async function (event) {
    let letter = event.key.toLowerCase();
    if (alphabet.includes(letter)) {
        let keyOnKeyboard = document.getElementById("clavier-" + letter);
        keyOnKeyboard.classList.remove("active");
        await testLetter(keyOnKeyboard);
    }
});

// Theme
document.documentElement.addEventListener("theme-changed", (e) => document.getElementById("theme").innerText = e.detail.dark ? "☀" : "🌙");
document.getElementById("theme").addEventListener("click", () => changeTheme(document.documentElement.dataset.theme === "light"));

// Dropdown
document.querySelector(".buttonWithDropdown > .openDropdown").addEventListener("click", function (e) {
    e.stopPropagation();
    this.parentElement.classList.toggle("show");
    this.innerText = this.parentElement.classList.contains("show") ? "⏶" : "⏷";
});
window.addEventListener("click", function () {
    for (let dropdown of document.querySelectorAll(".buttonWithDropdown.show")) dropdown.classList.remove("show");
});
