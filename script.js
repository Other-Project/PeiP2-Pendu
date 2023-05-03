let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const dico = "https://other-project.github.io/PeiP2-Pendu/dico.txt";
let word = "";
let lettersOfTheWord = [];
let discoveredLetters = [];
let errors = 0;
let maxNbOfError = 0;

async function fetchWordsAsync(url) {
    let response = await fetch(url);
    return await response.text();
}

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

function writeWord() {
    let mot = document.getElementById("mot");

    let oldLetters = mot.getElementsByClassName("lettre");
    while (oldLetters.length)
        oldLetters[0].remove();

    let lettreTemplate = document.getElementById("lettre-template");
    let found = word.split('')
        .map(function (letter) {
            return discoveredLetters.includes(letter) ? letter : " "
        });
    for (let character of found) {
        let lettre = document.importNode(lettreTemplate.content, true);
        lettre.querySelector("span").innerText = character;
        mot.appendChild(lettre);
    }
}

function checkVictoryAndDefeat() {
    let win = discoveredLetters.sort().toString() === lettersOfTheWord.toString();
    let loose = errors >= maxNbOfError;
    if (!win && !loose) return;

    let message = document.getElementById("message");
    message.classList.remove("notDisplayed");
    message.innerText = win ? "Vous avez gagné" : "Vous avez perdu, le mot était " + word;
    let playBtn = document.getElementById("jouer");
    playBtn.classList.remove("notDisplayed");
    playBtn.innerText = "Rejouer";

    for (let letter of document.getElementsByClassName("lettreClavier"))
        letter.setAttribute("disabled", true);
}

function testLetter(btn) {
    if (errors >= maxNbOfError) return;

    // We check that the data-letter attribute is valid (a letter of the alphabet)
    if (!alphabet.includes(btn.dataset.letter)) {
        // We reset the keyboard.
        // By doing this, the current state of the keyboard is lost. But no one will change the DOM right?
        populateKeyboard();

        console.error("You've changed the DOM, cheater ! The keyboard has been reset.");
        return;
    }
    if (btn.hasAttribute("disabled")) return;

    if (word.includes(btn.dataset.letter)) {
        console.log(btn.dataset.letter + " is in the word", discoveredLetters);
        btn.classList.add("good");
        if (!discoveredLetters.includes(btn.dataset.letter)) discoveredLetters.push(btn.dataset.letter);
        writeWord();
    } else {
        console.log(btn.dataset.letter + " isn't in the word");
        btn.classList.add("wrong");
        document.querySelector("#pendu > .notDisplayed").classList.remove("notDisplayed");
        errors++;
    }
    btn.setAttribute("disabled", true);
    updateStats();
    checkVictoryAndDefeat();
}

function generateStartingPoint() {
    const minNumberOfLetters = Math.max(lettersOfTheWord.length / 3, 1);
    const maxNumberOfLetters = lettersOfTheWord.length / 2;
    const numberOfLetters = Math.floor(Math.max(Math.random() * maxNumberOfLetters, minNumberOfLetters));
    console.log("Generating " + numberOfLetters + " letter(s) in " + lettersOfTheWord);
    for (let i = 0; i < numberOfLetters; i++){
        let letter = lettersOfTheWord[Math.floor(Math.random() * lettersOfTheWord.length)];
        if (!discoveredLetters.includes(letter)) discoveredLetters.push(letter);
    }
}

function updateStats() {
    document.getElementById("nbErreur").innerText = errors;
    document.getElementById("essaisRestants").innerText = (maxNbOfError - errors).toString();
}

async function newGame() {
    let elementToBeDisplayed = document.getElementsByClassName("notDisplayed");
    while (elementToBeDisplayed.length)
        elementToBeDisplayed[0].classList.remove("notDisplayed");
    document.getElementById("jouer").classList.add("notDisplayed");
    document.getElementById("message").classList.add("notDisplayed");
    for (let partiePendu of document.getElementsByClassName("perso"))
        partiePendu.classList.add("notDisplayed");

    const words = (await fetchWordsAsync(dico)).split('\n'); // https://fr.wiktionary.org/wiki/Wiktionnaire:Liste_de_1750_mots_fran%C3%A7ais_les_plus_courants
    word = words[Math.floor(Math.random() * words.length)];
    //word = "ANTICONSTITUTIONNELLEMENT";
    lettersOfTheWord = word.split('').filter(function (item, pos) {
        return word.indexOf(item) === pos; // On ne garde que la première occurrence de la lettre dans le mot
    }).sort();
    errors = 0;
    maxNbOfError = document.getElementsByClassName("perso").length;
    discoveredLetters = [];
    updateStats();
    generateStartingPoint();
    populateKeyboard();
    writeWord();
}

function changeTheme(toDark){
    document.documentElement.dataset.theme = toDark ? "dark" : "light";
    document.getElementById("theme").innerText = toDark ? "☀" : "🌙";
}
changeTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', function(e) { changeTheme(e.matches); });
document.getElementById("theme").addEventListener("click", function(){
    changeTheme(document.documentElement.dataset.theme === "light");
});
window.addEventListener('devtoolschange', event => {
    if (event.detail.isOpen) console.warn("La console a été ouverte, j'ose espérer que ce n'est pas pour tricher !");
});
document.addEventListener('keydown', async function (event) {
    if(event.key === "Enter"){
        let playBtn = document.getElementById("jouer");
        if(!playBtn.classList.contains("notDisplayed")) await newGame();
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
document.getElementById("jouer").addEventListener("click", newGame);
