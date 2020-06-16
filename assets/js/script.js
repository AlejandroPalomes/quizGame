var ws;
var users = [];
var currGame
var answers
var selectedAnswers = []
let questionCount = 0 
let correctAnswers = 0;
let wrongAnswers = 0;

//? Multiplayer Variabeles
let seconds = 31;
let createBtn = elem("#createGameBtn");
let joinBtn = elem("#joinGameBtn");
let soloBtn = elem("#enterGameBtn");
let nPlayers = 1;
let nFinished = 0;
let resultsMultiplayer = [];
let orderedResults = [];
let lastClick;

let answerTime = 10; //time to answer the question
let nQuestions = 5; //number of questions

var globalInterval
var user = JSON.parse(localStorage.getItem("user")) || {
    id: "",
    name: "",
    image: "",
    countGames: 0,
    win: 0,
    loose: 0,
    totalC: 0,
    totalW: 0,
    currR: "",
    ratio: 0,
    level: 0,
    experience: 0,
    isPlaying: false,
    readyToPlay: false
}

var anonymousUser = ["quagga", "kiwi", "nyancat", "dragon", "anteater", "blobfish", "chupacabra", "bat", "ifrit", "kraken", "manatee", "ferret", "llama", "koala", "platypus", "wombat", "iguana", "mink", "narwhal", "liger", "turtle", "skunk", "raccoon", "crow", "otter", "dinosaur"];

// ! ============ LISTENERS ============ ! \\

elem("#usernameInp").onkeyup = function (e) {
    if (e.keyCode == 13) saveUser()
}
elem("#usernameBtn").addEventListener("click", saveUser)
elem("#chatBtn").addEventListener("click", () => showChat("small"))
elem("#chatBtn2").addEventListener("click", () => showChat("big"))
elem("#profileBtn").addEventListener("click", showProfile)
elem("#rankingBtn").addEventListener("click", () => showRanking("level", true))
elem("#rankingBtn2").addEventListener("click", () => showRanking("level", true, "big"))
elem("#byLevel").addEventListener("click", () => showRanking("level"))
elem("#byRatio").addEventListener("click", () => showRanking("ratio"))
elem("#byCorrect").addEventListener("click", () => showRanking("correct"))
elem("#byLevel2").addEventListener("click", () => showRanking("level", false, "big"))
elem("#byRatio2").addEventListener("click", () => showRanking("ratio", false, "big"))
elem("#byCorrect2").addEventListener("click", () => showRanking("correct", false, "big"))
elem("#chatSendBtn").addEventListener("click", () => onSendChat("small"))
elem("#chatSendBtn2").addEventListener("click", () => onSendChat("big"))
soloBtn.addEventListener("click", () => {
    showQuestions();
    soloBtn.disabled = true;
    setTimeout(() => {
        soloBtn.disabled = false;
    }, 1000);
})
createBtn.addEventListener("click", createMultiplayer)
joinBtn.addEventListener("click", preJoinMultiplayer)
elem("#chatInp").onkeyup = e => {
    if (e.keyCode == 13) onSendChat("small");
}
elem("#chatInp2").onkeyup = e => {
    if (e.keyCode == 13) onSendChat("big");
}

elem("#summaryBackProfile").addEventListener("click", () => {
    elem("#summary").classList.remove("open");
    correctAnswers = 0;
    wrongAnswers = 0;
});
elem("#groupBackProfile").addEventListener("click", () => {
    elem("#group").classList.remove("open");
    correctAnswers = 0;
    wrongAnswers = 0;
    while (elem(".group__box").firstChild) {
        elem(".group__box").removeChild(elem(".group__box").lastChild);
    }
});
elem("#summaryNewGame").addEventListener("click", () => {
    setTimeout(() => {
        elem("#summary").classList.remove("open");
    }, 400);
    correctAnswers = 0;
    wrongAnswers = 0;
    showQuestions();
});

elem("#winGraph").addEventListener("mouseover", () => showData("winGraph"));
elem("#winGraph").addEventListener("mouseout", () => showData("winGraph"));
elem("#winGraph").addEventListener("mousemove", (e) => moveData(e));
elem("#looseGraph").addEventListener("mouseover", () => showData("looseGraph"));
elem("#looseGraph").addEventListener("mouseout", () => showData("looseGraph"));
elem("#looseGraph").addEventListener("mousemove", (e) => moveData(e));
elem("#profileRatio").addEventListener("mouseover", () => showData("profileRatio"));
elem("#profileRatio").addEventListener("mouseout", () => showData("profileRatio"));
elem("#profileRatio").addEventListener("mousemove", (e) => moveData(e, "profileRatio"));
elem("#summaryWinGraph").addEventListener("mouseover", () => showData("summaryWinGraph"));
elem("#summaryWinGraph").addEventListener("mouseout", () => showData("summaryWinGraph"));
elem("#summaryWinGraph").addEventListener("mousemove", (e) => moveData(e, "summaryWinGraph"));
elem("#summaryLooseGraph").addEventListener("mouseover", () => showData("summaryLooseGraph"));
elem("#summaryLooseGraph").addEventListener("mouseout", () => showData("summaryLooseGraph"));
elem("#summaryLooseGraph").addEventListener("mousemove", (e) => moveData(e, "summaryLooseGraph"));
elem("#summaryXPGraph").addEventListener("mouseover", () => showData("summaryXPGraph"));
elem("#summaryXPGraph").addEventListener("mouseout", () => showData("summaryXPGraph"));
elem("#summaryXPGraph").addEventListener("mousemove", (e) => moveData(e, "summaryXPGraph"));

window.onbeforeunload = leaveGame;

elem("#imgImport").addEventListener("change", () => {
    var info = elem("#imgImportInfo");
    var file = (elem("#imgImport").files[0]);
    info.textContent = truncate(file.name, 25, false);
    info.style = "color: #20C868"
    if (file.size > 40000) {
        alert("File too big! Max size: 40kb");
        info.textContent = truncate(file.name, 15, false) + " won't be uploaded";
        info.style = "color: #F52631"
    }
});

// ! ============ FUNCTIONS ============ ! \\

init();


function joinGame() {
    elem("#confirmY").removeEventListener("click", joinGame)
    ws = new WebSocket("wss://cloud.achex.ca");
    ws.onopen = function (e) {
        ws.send(`{"setID":"quizGame", "passwd":"12345"}`);

    }
    ws.onmessage = function (response) {
        let responseUser = JSON.parse(response.data);

        if (responseUser.auth == "OK") {
            ws.send(`{"to":"quizGame", "user":"${responseUser.SID}", "type":"connect"}`);
            user.id = responseUser.SID;
            localStorage.setItem("user", JSON.stringify(user))
            showProfile()
        }
        switch (responseUser.type) {
            case "connect":
                sendUser(JSON.stringify(user))
                break
            case "messageU":
                printMessage(responseUser.user, responseUser.content)
                break
            case "disconnect":
                sendUser(JSON.stringify(user))
                if (responseUser.online || responseUser.ready) nPlayers--;
                console.log(nPlayers)
                return
            case "user":
                printUsers(responseUser.user)
                break
            case "update":
                updateUsers(responseUser.user)
                break
            case "multiplayerInit":
                updateMultButton(responseUser.user)
                break
            case "multiplayerStart":
                startMultGame(responseUser.user, responseUser.questions)
                break
            case "joinGame":
                nPlayers++;
                console.log(nPlayers)
                break
            case "finished":
                nFinished++;
                checkOtherUsers(responseUser.user, responseUser.time, responseUser.correct);
                break
            case "reset":
                resetStatus();
                break
        }
    }
    ws.onclose = function (e) {
        console.log("onclose")
    }
}

function init() {
    if (!user.name.length || !user.name) {
        showLogin()
    } else {
        showConfirmUser()
    }
}

function sendUser(user) {
    users = [];
    ws.send(`{"to":"quizGame", "user":${user}, "type":"user"}`);
}

function printUsers(userData) {
    if (userData.name != "" && userData.id != "") {
        users.push({
            name: userData.name,
            userId: userData.id,
            ratio: userData.ratio,
            wons: userData.win,
            correct: userData.totalC,
            level: userData.level,
            image: userData.image,
            isPlaying: userData.isPlaying,
            readyToPlay: userData.readyToPlay
        });
    }
    if (!user.readyToPlay && !user.isPlaying) {
        if (userData.isPlaying) disableButtons("join");
        else if (userData.readyToPlay) disableButtons("ask");
        else if (!userData.readyToPlay && !userData.isPlaying) disableButtons("reset");
    }
    console.log(users);
}

function printMessage(userData, message) {
    if (!(elem("#chat").classList.contains("open"))) elem("#chatNot").classList.remove("d-none");
    if (!(elem("#chat--big").classList.contains("open"))) elem("#chatNot--big").classList.remove("d-none");
    var msg = document.createElement("div");
    var msgUser = document.createElement("div");
    var msgContent = document.createElement("div");

    msg.className = `msg ${userData.id == user.id ? "sent" : "received"} mb-2 p-1 d-flex justify-content-around`
    msgUser.classList.add("msg__user");
    msgUser.style = `background-image: url(${userData.image}); background-size: cover;`;;
    msgContent.className = `msg__content p-2 pr-3 ${userData.id == user.id ? "self" : ""}`;

    msgContent.innerHTML = `<b>${userData.name}</b><br>${message}`;

    msg.append(msgUser);
    msg.append(msgContent);
    var msg2 = msg.cloneNode(true);
    elem("#chatBox1").append(msg);
    elem("#chatBox2").append(msg2);
    elem("#chatBox1").scrollTop = elem("#chatBox1").scrollHeight;
    elem("#chatBox2").scrollTop = elem("#chatBox2").scrollHeight;
}

function saveUser() {
    user.name = elem("#usernameInp").value

    if (elem("#imgImport").value.length) {

        var file = (elem("#imgImport").files[0]);
        var reader = new FileReader();

        reader.onloadend = function () {
            (file.size < 40000) ? user.image = reader.result: user.image = `https://ssl.gstatic.com/docs/common/profile/${anonymousUser[Math.floor(Math.random() * (anonymousUser.length))]}_lg.png`;
        }

        if (file) {
            reader.readAsDataURL(file);
        } else {
            user.image = "";
        }
    } else {
        user.image = `https://ssl.gstatic.com/docs/common/profile/${anonymousUser[Math.floor(Math.random() * (anonymousUser.length))]}_lg.png`
    }

    if (user.name.length) {
        joinGame();
        return
    }
    elem('#usernameInp').style.cssText = "border-color: red; background-color: rgba(255,0,0,.2);"
}

function truncate(str, n, useWordBoundary) {
    if (str.length <= n) {
        return str;
    }

    var subString = str.substr(0, n - 1);
    return (useWordBoundary ? subString.substr(0, subString.lastIndexOf(" ")) : subString) + " (...)";
}

function showLogin() {
    let register = elem("#login")
    let confirm = elem("#confirm")
    let profile = elem("#profile")
    register.classList.add("d-flex")
    register.classList.remove("d-none")
    confirm.classList.add("d-none")
    confirm.classList.remove("d-flex")
    profile.classList.add("d-none")
    profile.classList.remove("d-flex")
    elem("#usernameInp").focus()
}

function showConfirmUser() {
    elem("#name-confirm").innerText = `"${user.name}"`
    let register = elem("#login")
    let confirm = elem("#confirm")
    let profile = elem("#profile")
    register.classList.remove("d-flex")
    register.classList.add("d-none")
    confirm.classList.remove("d-none")
    confirm.classList.add("d-flex")
    profile.classList.add("d-none")
    profile.classList.remove("d-flex")
    elem("#confirmN").onclick = () => {
        showLogin();
        user.countGames = 0;
        user.totalC = 0;
        user.totalW = 0;
        user.ratio = 0;
        user.win = 0;
        user.loose = 0;
        user.level = 0;
        user.experience = 0;
    }
    elem("#confirmY").onclick = joinGame
}

function showProfile() {
    let register = elem("#login")
    let confirm = elem("#confirm")
    let profile = elem("#profile")
    register.classList.remove("d-flex")
    register.classList.add("d-none")
    confirm.classList.add("d-none")
    confirm.classList.remove("d-flex")
    profile.classList.remove("d-none")
    profile.classList.add("d-flex")
    elem("#ranking").classList.remove("open");
    elem("#chat").classList.remove("open");
    showProfileData()
}

function showProfileData() {
    elem("#profileUsername").innerText = user.name
    elem("#profileWons").innerText = user.win
    elem("#profileLevel").innerText = user.level
    elem("#profileGames").innerText = user.countGames
    elem(".profile__container__info--img").style = `background-image: url(${user.image}); background-size: cover; background-position: center; background-repeat: no-repeat`;
    elem("#profileBtn").style = `background-image: url(${user.image}); background-size: cover; background-position: center; background-repeat: no-repeat`;
    setTimeout(function () {
        animaProfileRatio()
        elem("#winGraph").style.height = Math.floor((user.totalC / (user.totalC + user.totalW)) * 100) + "%";
        elem("#looseGraph").style.height = Math.floor((user.totalW / (user.totalC + user.totalW)) * 100) + "%"
    }, 100)
    elem("#menuSmall").classList.replace("d-none", "d-flex");
    elem("#sideMenu").classList.replace("d-md-none", "d-md-flex");
    elem(".main__contentShow").classList.remove("d-none");
}

function showChat(from) {
    if (from === "small") {
        elem("#chatBtn").disabled = true
        elem("#chat").ontransitionend = () => {
            elem("#chatBtn").disabled = false
            if (elem("#chat").classList.contains("open")) elem("#chatInp").focus();
        }
        setTimeout(() => {
            elem("#chat").classList.toggle("open");
            elem("#chatNot").classList.add("d-none");
        }, 300);
        elem("#ranking").classList.remove("open");
    } else {
        elem("#chat--big").classList.add("open");
        elem("#chatNot--big").classList.add("d-none");
        elem("#ranking2").classList.remove("open")
    }
}

function showRanking(order, mainBtn, from) {
    const rkgBox = elem(".ranking__box");
    const rkgBox2 = elem(".ranking__box2");
    var title;
    var result;
    var element;
    (from != "big") ? element = elem("#ranking"): element = elem("#ranking2");

    if (!element.classList.contains("open") || order !== "level" || !mainBtn) {
        while (rkgBox.firstChild) {
            rkgBox.removeChild(rkgBox.lastChild);
        }
        while (rkgBox2.firstChild) {
            rkgBox2.removeChild(rkgBox2.lastChild);
        }
        users.sort(compareUsers(order, 'desc'))
        users.forEach((e, index) => {
            if (order == "level") {
                title = "Level";
                result = e.level
            };
            if (order == "ratio") {
                title = "Ratio";
                result = e.ratio + "%"
            };
            if (order == "correct") {
                title = "Correct answers";
                result = e.correct
            };

            var main = document.createElement("div");
            var content = document.createElement("div");
            var position = document.createElement("div");
            var spanPos = document.createElement("span")
            var data = document.createElement("div");
            var photo = document.createElement("div");

            main.className = "rkg mb-2 p-1 d-flex justify-content-around";
            content.className = "rkg__content p-1 d-flex justify-content-between";
            position.className = "rkg__content--position";
            spanPos.textContent = index + 1;
            data.className = "rkg__content--data";
            data.innerHTML = `<b>Name: </b><span id="rkgUser">${e.name}</span><br><b>${title}: </b><span id="rkgLevel">${result}</span>`;
            photo.className = 'rkg__user';
            photo.style = `background-image: url(${e.image});`

            position.appendChild(spanPos);
            content.appendChild(position);
            content.appendChild(data);
            content.appendChild(photo);
            main.appendChild(content);
            var main2 = main.cloneNode(true)
            rkgBox.appendChild(main);
            rkgBox2.appendChild(main2);
        });
    }
    elem(".ranking__btn", true).forEach(e => e.dataset.action == order ? e.classList.add("ranking__btn--active") : e.classList.remove("ranking__btn--active"));
    elem(".ranking__btn--big", true).forEach(e => e.dataset.action == order ? e.classList.add("ranking__btn--active") : e.classList.remove("ranking__btn--active"));

    if (mainBtn && from != "big") {
        setTimeout(() => {
            elem("#ranking").classList.toggle("open");
        }, 200);
        elem("#chat").classList.remove("open");
    } else if (mainBtn && from == "big") {
        setTimeout(() => {
            elem("#ranking2").classList.add("open");
        }, 200);
        elem("#chat--big").classList.remove("open");
    }
}

function animaProfileRatio() {
    let count = 0
    if (globalInterval) {
        clearInterval(globalInterval)
    }
    globalInterval = setInterval(() => {
        elem("#profileRatio").innerText = count + "%"
        if (count >= user.ratio) clearInterval(globalInterval)
        else count++
    }, 11);
}

function onSendChat(from) {
    ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "content":"${(from === "small") ? elem("#chatInp").value : elem("#chatInp2").value}", "type":"messageU"}`);
    (from === "small") ? elem("#chatInp").value = "": elem("#chatInp2").value = "";
}

function leaveGame() {

    user.id = ""
    user.name = ""
    user.image = ""
    ws.send(`{"to":"quizGame", "userId":"", "username":"", "ready":${JSON.stringify(user.readyToPlay)}, "online":${JSON.stringify(user.isPlaying)}, "type":"disconnect"}`);
    user.isPlaying = false;
    user.readyToPlay = false;
    ws.close();
    return false;
}

function getQuestions(amount) {
    axios
        .get("https://opentdb.com/api.php?difficulty=easy&amount=" + amount)
        .then(function (response) {
            currGame = response.data.results;
        })
}

function mixAnswers() {
    answers = currGame[questionCount].incorrect_answers
    answers.push(currGame[questionCount].correct_answer)
    answers.sort(() => Math.random() - 0.5)
}

function showQuestions() {

    elem("#questions").classList.toggle("open")
    getQuestions(nQuestions)
    elem("#questions").addEventListener("transitionend", showCountDown)
}

function showCountDown() {
    let countDown = document.createElement("div")
    countDown.className = "countdown"
    let countNumber = document.createElement("span")
    countNumber.className = "countdown__number"
    countNumber.id = "countdownNumber"
    countDown.append(countNumber)
    elem("#questions").append(countDown)

    if (globalInterval) {
        clearInterval(globalInterval)
    }
    let down = 3
    elem("#countdownNumber").innerText = down
    elem("#countdownNumber").dataset.color = down
    globalInterval = setInterval(() => {
        down -= 1
        elem("#countdownNumber").innerText = down
        elem("#countdownNumber").dataset.color = down
        if (!down) {
            clearInterval(globalInterval)
            countDown.remove()
            showQuestion()
        }
    }, 1000);
    elem("#questions").removeEventListener("transitionend", showCountDown)
}

function showQuestion() {
    if (questionCount + 1 > currGame.length) {
        if (!user.isPlaying) {
            setTimeout(() => {
                elem("#questions").classList.toggle("open");
                elem("#question").remove();
            }, 700);
            checkResults();
            questionCount = 0
        } else {
            ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "time":${JSON.stringify(lastClick)}, "correct":${JSON.stringify(correctAnswers)}, "type":"finished"}`);
            checkOtherUsers("function showQuestion");
            elem("#questions").innerHTML = '<h2 class="loader__container">Waiting players <span class="loader"><span class="cssload-loader"></span></span></h2>'
        }
        return
    }
    mixAnswers()

    if (elem("#question")) elem("#question").remove()
    elem("#questions").innerHTML = elem("#templateQuestion").innerHTML
    //Insert question
    elem("#question .question__category").innerText = currGame[questionCount].category
    elem("#question .question__number").innerText = (questionCount + 1) + "/" + currGame.length
    elem("#question h2").innerHTML = currGame[questionCount].question

    setTimeout(function () {
        elem("#question").classList.toggle("open")
        let transition = 0.9
        answers.forEach((btn, index) => {
            let button = document.createElement("button")
            button.className = "question__btn btn-grad"
            button.dataset.answers = index
            button.innerHTML = btn
            elem("#question .answers").append(button)
            button.style.animation = `appear ${transition += 0.2}s ease-in-out forwards`

            button.onclick = (e) => {
                lastClick = e.timeStamp
                selectedAnswers.push(btn)
                if (btn == currGame[questionCount - 1].correct_answer) {
                    button.style.backgroundColor = "rgb(32, 200, 104)";
                    correctAnswers++;
                } else {
                    button.style.backgroundColor = "rgb(245, 38, 49)";
                    elem("#question .answers button", true).forEach((correct) => {
                        if (correct.innerHTML == currGame[questionCount - 1].correct_answer) {
                            correct.style.backgroundColor = "rgb(32, 200, 104)";
                        }
                    })
                    wrongAnswers++;
                }
                stopQuestion()
                button.disabled = true
                elem("#question .answers button", true).forEach(button => button.disabled = true)
            }
        })
        questionTime()
    }, 200)
    questionCount++
}

function questionTime() {
    let bar = elem(".seconds")
    bar.classList.add("questiondown");
    barW = bar.parentElement.clientWidth;
    wPerSecond = barW / answerTime
    if (globalInterval) {
        clearInterval(globalInterval)
    }
    let sec = 0
    globalInterval = setInterval(() => {
        barW -= wPerSecond
        if (barW < 0) bar.style.width = "0px"
        sec++

        if (sec > answerTime) { 
            elem("#question .answers button", true).forEach(button => button.disabled = true)
            wrongAnswers++;
            stopQuestion()
        }
    }, 1000);
}

function stopQuestion(next = true) {
    clearInterval(globalInterval)
    elem(".seconds").style.webkitAnimationPlayState = "paused";
    setTimeout(() => {
        elem("#question").classList.toggle("open")
        if (next) {
            setTimeout(function () {
                showQuestion()
            }, 700)
        }
    }, 1000);
}

function checkResults() {
    var winner;
    if (((correctAnswers / nQuestions) * 100 >= 70) && !user.isPlaying) {
        user.experience++;
        user.win++
        winner = true;
    } else {
        user.loose++
        winner = false;
    }

    if (user.isPlaying && resultsMultiplayer.length > 1) {
        orderedResults.forEach((e, i) => {
            if (e.id === user.id && i == 0) {
                user.experience++;
                user.win++
                winner = true;
            } else {
                user.loose++
                winner = false;
            }
        });
    }

    if (user.experience >= user.level && user.experience != 0) {
        user.level++;
        user.experience = 0;
    }

    user.countGames++;
    user.totalC += correctAnswers;
    user.totalW += wrongAnswers;
    user.ratio = (Math.floor((user.win / user.countGames) * 100));

    showProfileData();
    if (user.isPlaying) {
        user.isPlaying = false
        showGroup()
        user.reset = true
        localStorage.setItem("user", JSON.stringify(user))
        ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "type":"update"}`);
    } else {
        showSummary(winner)
        localStorage.setItem("user", JSON.stringify(user))
        ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "type":"update"}`);
    }
}

function showSummary(win) {
    elem(".summary__container__info--img").style = `background-image: url(${user.image}); background-size: cover; background-position: center; background-repeat: no-repeat`;
    elem("#summaryWinGraph").style = "height: " + Math.floor((correctAnswers / nQuestions) * 100) + "%;";
    elem("#summaryLooseGraph").style = "height: " + Math.floor((wrongAnswers / nQuestions) * 100) + "%;";
    elem("#summaryXPGraph").style = "height: " + Math.floor((user.experience / (user.level + 1)) * 100) + "%;";
    elem("#summaryHits").textContent = correctAnswers;
    elem("#summaryMisses").textContent = wrongAnswers;
    elem("#summaryXP").textContent = win ? "+1" : "0";
    elem("#summaryTotalXP").textContent = user.experience;
    if (!user.isPlaying) {
        elem("#summary").classList.toggle("open");
    }
}

function showGroup() {
    if (elem(".loader__container")) elem(".loader__container").remove()
    elem(".group__container__info--img").style = `background-image: url(${orderedResults[0].image}); background-size: cover; background-position: center; background-repeat: no-repeat`;
    elem("#groupWinner").textContent = orderedResults[0].name;
    elem("#groupWinnerHits").textContent = orderedResults[0].correct;

    orderedResults.forEach((e, i) => {
        if (i > 0) {
            var main = document.createElement("div");
            var content = document.createElement("div");
            var data = document.createElement("div");
            var photo = document.createElement("div");

            main.className = "grt mb-2 p-1 d-flex justify-content-around";
            content.className = "grt__content p-1 d-flex justify-content-between";
            data.className = "grt__content--data";
            data.innerHTML = `<span>${e.name}:</span><br><span>${e.correct} answers</span>`;
            photo.className = 'grt__user';
            photo.style = `background-image: url(${e.image});`

            content.appendChild(photo);
            content.appendChild(data);
            main.appendChild(content);
            elem(".group__box").appendChild(main);
        }
    });

    elem("#group").classList.toggle("open");
    ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "type":"reset"}`);
}

function elem(selector, all = false) {
    return all ? document.querySelectorAll(selector) : document.querySelector(selector)
}

function showData(source) {
    if (source === "winGraph") {
        elem("#answerPercentage").textContent = Math.floor((user.totalC / (user.totalC + user.totalW)) * 100) + "%";
        elem("#answerPercentage").style = "color: #20C868;"
        elem("#answerExplain").textContent = "of correct answers";

    } else if (source === "profileRatio") {
        elem("#answerPercentage").textContent = user.ratio + "%";
        elem("#answerPercentage").style = "color: #20C868;"
        elem("#answerExplain").textContent = "of won games";
    } else if (source === "summaryWinGraph") {
        elem("#answerPercentage").textContent = Math.floor((correctAnswers / nQuestions) * 100) + "%";
        elem("#answerPercentage").style = "color: #20C868;"
        elem("#answerExplain").textContent = "of correct aswers";
    } else if (source === "summaryLooseGraph") {
        elem("#answerPercentage").textContent = Math.floor((wrongAnswers / nQuestions) * 100) + "%";
        elem("#answerPercentage").style = "color: #F52631;"
        elem("#answerExplain").textContent = "of wronged aswers";
    } else if (source === "summaryXPGraph") {
        elem("#answerPercentage").textContent = Math.floor((user.experience / (user.level + 1)) * 100) + "%";
        elem("#answerPercentage").style = "color: #20C868;"
        elem("#answerExplain").textContent = "XP for next lvl";
    } else {
        elem("#answerPercentage").textContent = Math.floor((user.totalW / (user.totalC + user.totalW)) * 100) + "%";
        elem("#answerPercentage").style = "color: #F52631;"
        elem("#answerExplain").textContent = "of wronged answers"
    }
    elem(".resultsScreen").classList.toggle("d-flex");
    elem(".resultsScreen").classList.toggle("d-none");
}

function moveData(e, source) {
    var sumX = 0;
    source === "profileRatio" ? sumX = -135 : sumX = 15;
    elem(".resultsScreen").style = `top: ${e.clientY - 85}px; left: ${e.clientX + sumX}px;`
}

function updateUsers(userData) {
    users.forEach(e => {
        if (e.userId == userData.id) {
            e.ratio = userData.ratio;
            e.wons = userData.win;
            e.correct = userData.totalC;
            e.level = userData.level;
        }
    });
}

function compareUsers(key, order = 'asc') {
    return function innerSort(a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            // property doesn't exist on either object
            return 0;
        }

        const varA = (typeof a[key] === 'string') ?
            a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string') ?
            b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return (
            (order === 'desc') ? (comparison * -1) : comparison
        );
    };
}


//! ============== Multiplayer section =============== !\\


function createMultiplayer() {
    ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "type":"multiplayerInit"}`);
    disableButtons("create");
    getQuestions(nQuestions);
    user.readyToPlay = true;
    if (globalInterval) {
        clearInterval(globalInterval)
    }
    globalInterval = setInterval(() => {
        seconds--
        createBtn.textContent = "00:" + ((seconds < 10) ? "0" + seconds : seconds)
        if (seconds <= 0) {
            clearInterval(globalInterval);
            ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "questions":${JSON.stringify(currGame)}, "type":"multiplayerStart"}`);
        }
    }, 1000);
}

function updateMultButton(userData) {
    if (userData.id != user.id) {
        disableButtons("ask");
    }
}

function preJoinMultiplayer() {
    user.readyToPlay = true;
    joinBtn.classList.add("d-none");
    createBtn.classList.remove("d-none");
    createBtn.disabled = true;
    createBtn.classList.add("disabledBtn");
    soloBtn.disabled = true;
    soloBtn.classList.add("disabledBtn");
    ws.send(`{"to":"quizGame", "user":${JSON.stringify(user)}, "type":"joinGame"}`);
}

function startMultGame(userData, questions) {
    if (userData.id == user.id || user.readyToPlay) {
        elem("#questions").classList.toggle("open")
        currGame = questions;
        elem("#questions").addEventListener("transitionend", showCountDown);
        user.readyToPlay = false;
        user.isPlaying = true;
        user.isPlaying = true;
        setTimeout(() => {
            disableButtons("reset")

        }, 700);
    } else {
        disableButtons("join")
    }
}

function checkOtherUsers(user, time, correctA) {
    if (!(user.id === undefined)) {
        resultsMultiplayer.push({
            id: user.id,
            image: user.image,
            name: user.name,
            time: time,
            correct: correctA
        });
    }
    if (user.isPlaying && nPlayers == nFinished) {
        setTimeout(() => {
            elem("#questions").classList.toggle("open");
        }, 700);

        for (var i = nQuestions; i >= 0; i--) {
            var temp = resultsMultiplayer.filter(e => e.correct == i);
            temp.sort(compareUsers("time", "asc"));
            temp.forEach(e => orderedResults.push(e));
        };
        checkResults();
        questionCount = 0
        nFinished = 0;
        nPlayers = 1;
    }
}

//reset all variables to it's state before multiplayer
function resetStatus() {
    if (user.reset) {
        questionCount = 0;
        correctAnswers = 0;
        wrongAnswers = 0;
        lastClick;
        user.isPlaying = false;
        user.reset = false;
        user.readyToPlay = false;
    }
    joinBtn.classList.add("d-none");
    createBtn.textContent = "Create Game";
    createBtn.disabled = false;
    joinBtn.disabled = true;
    createBtn.classList.remove("d-none");
    createBtn.classList.remove("disabledBtn");
    seconds = 30;
    nPlayers = 1;
    nFinished = 0;
    resultsMultiplayer = [];
    orderedResults = [];
}

function disableButtons(opt) {
    if (opt === "create") {
        createBtn.disabled = true;
        createBtn.classList.add("disabledBtn");
        soloBtn.disabled = true;
        soloBtn.classList.add("disabledBtn");
    } else if (opt === "ask") {
        joinBtn.classList.remove("d-none");
        joinBtn.disabled = false;
        createBtn.classList.add("d-none");
        if (globalInterval) {
            clearInterval(globalInterval)
        }
        globalInterval = setInterval(() => {
            seconds--
            createBtn.textContent = "00:" + ((seconds < 10) ? "0" + seconds : seconds)
            if (seconds <= 0) {
                clearInterval(globalInterval);
                createBtn.textContent = "Create Game";
            }
        }, 1000);
    } else if (opt === "join") {
        joinBtn.classList.add("d-none");
        createBtn.classList.remove("d-none");
        createBtn.disabled = true;
        createBtn.classList.add("disabledBtn");
    } else if (opt === "reset") {
        createBtn.disabled = false;
        createBtn.classList.remove("disabledBtn");
        soloBtn.disabled = false;
        soloBtn.classList.remove("disabledBtn");
    }
}