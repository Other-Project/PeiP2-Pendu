let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let word = "ANANAS";

function populateKeyboard() {
    let clavier = document.getElementById("clavier");
    let lettreClavierTemplate = document.getElementById("lettreClavier-template");
    for (let lettre of alphabet) {
        let lettreClavier = document.importNode(lettreClavierTemplate.content, true);
        lettreClavier.querySelector("span").innerText = lettre;
        lettreClavier.querySelector("div").dataset.letter = lettre;
        lettreClavier.querySelector("div").addEventListener("click", testLetter);
        clavier.appendChild(lettreClavier);
    }
}

function writeWord(word){
    let mot = document.getElementById("mot");

    let oldLetters = mot.getElementsByClassName("lettre");
    while (oldLetters.length)
        oldLetters[0].remove();

    let lettreTemplate = document.getElementById("lettre-template");
    for (let character of word) {
        let lettre = document.importNode(lettreTemplate.content, true);
        lettre.querySelector("span").innerText = character;
        mot.appendChild(lettre);
    }
}

function testLetter(){
    if(word.includes(this.dataset.letter)) {
        console.log(this.dataset.letter + " is in the word");
        this.classList.add("good");
        //TODO
    }
    else {
        console.log(this.dataset.letter + " isn't in the word");
        this.classList.add("wrong");
        document.querySelector("#pendu > .notDisplayed").classList.remove("notDisplayed");
    }
    this.removeEventListener("click", testLetter);
    this.setAttribute("disabled", true);
}

function newGame() {
    let elementToBeDisplayed = document.getElementsByClassName("notDisplayed");
    while (elementToBeDisplayed.length)
        elementToBeDisplayed[0].classList.remove("notDisplayed");
    document.getElementById("jouer").classList.add("notDisplayed");
    for(let partiePendu of document.getElementById("pendu").children)
        partiePendu.classList.add("notDisplayed");

    populateKeyboard();
    writeWord("A A AS");
}

document.getElementById("jouer").addEventListener("click", newGame);
