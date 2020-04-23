//jshint esversion:6

/////////////////MODULES, SET UP///////////////////////////////
const dataBase = require(__dirname + "/database.js");
const mongoDB = require(__dirname + "/mongDB.js");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

/////////////////////////VARIABLES///////////////////////////////

function Test(listOfQuestions, uniqueId, currentQuestion) {
  this.listOfQuestions = listOfQuestions;
  this.uniqueId = uniqueId;
  this.currentQuestion = currentQuestion;
}

let uniqueId = 0;
let testList = [];


////////////////////  SERVER /////////////////////////

app.listen(3000, function() {
  console.log("server is running on port 3000");
});

app.post("/next/:id", function(req, res) {
  var idOfRequest = parseInt(req.params.id);
  var action = req.body.button;
  console.log(req.body);
  var currentTest = getCurrentTest(idOfRequest);
  currentTest.listOfQuestions[currentTest.currentQuestion].pick = req.body.pick;

  console.log("Picture number = " + currentTest.listOfQuestions[currentTest.currentQuestion].picture);

  if ((currentTest.listOfQuestions.length - 1) === currentTest.currentQuestion && action === "next"){
    res.redirect("/result/" + idOfRequest);
  }

  if (action === "next") {
    currentTest.currentQuestion++;
  } else if (action === "previous") {
    currentTest.currentQuestion--;
  } else {
    currentTest.currentQuestion = parseInt(action) - 1;
  }
  // console.log("picture - " + currentTest.listOfQuestions[currentTest.currentQuestion].picture);
  res.render("index", {

    // image: currentTest.listOfQuestions[currentTest.currentQuestion].picture,
    id: currentTest.uniqueId,
    question: currentTest.listOfQuestions[currentTest.currentQuestion],
    questionList: currentTest.listOfQuestions,
    questionNumber: currentTest.currentQuestion

  });
});
app.get("/result/:id", function(req, res) {
  let testId = parseInt(req.params.id);
  let currentTest = getCurrentTest(testId);
  let numberOfQuestions = currentTest.listOfQuestions.length;
  let correctAnswers = 0;

  currentTest.listOfQuestions.forEach(function(question) {

    var chosenAnswer = question.pick;
    if (chosenAnswer != null && question.answers[parseInt(chosenAnswer)].isCorrect == 1) {
      correctAnswers++;
    }
  });
  const percentage = correctAnswers / numberOfQuestions * 100;
  // res.send("Correct answers: " + correctAnswers);
  res.render("result", {
    resultMessage: getResult(correctAnswers, numberOfQuestions),
    correctAnswers: correctAnswers,
    totalQuestions: numberOfQuestions,
    percentage: percentage,
    id: testId
  });
});

app.get("/review/:id", function(req, res){
  let testId = parseInt(req.params.id);
  let currentTest = getCurrentTest(testId);

  res.render("review", {
    questions: getIncorrect(currentTest.listOfQuestions)
  });
});

// app.get("/", function(req, res){
//   dataBase.getSections(function(sections){
//     res.render("home", {
//       sections: sections
//     });
//   });
// });

app.get("/:customerId/home", function(req, res){
    dataBase.getSections(function(sections){
      res.render("home", {
        sections: sections
      });
    });
})

app.get("/test/:number", function(req, res){
  let currentQuestion = 0;
  dataBase.getQuestions(req.params.number, function(questionList){
    let test = new Test(questionList, uniqueId, currentQuestion);
    testList.push(test);

    setTimeout(function() {
      // console.log(testList[0].listOfQuestions[1].question);
      res.render("index", {
        image: test.listOfQuestions[currentQuestion].picture,
        id: uniqueId,
        question: test.listOfQuestions[currentQuestion],
        questionList: test.listOfQuestions,
        questionNumber: currentQuestion
      });
      uniqueId++;
    }, 100);
  });
});

app.get("/login", function(req, res){
  res.render("login", {
    path: "/login/submit",
    action: "Prisijungti",
    wantReg: "Sukurti paskyrą",
    remindPass: "Pamiršai slaptažodį?"
  });
});

app.get("/register", function(req, res){
  res.render("login", {
    path: "/register/submit",
    action: "Registruotis",
    wantReg: "",
    remindPass: ""
  });
})

app.post("/login/submit", function(req, res){
  mongoDB.getClient(req.body.name, function(client){
    if (client){
      if (client.password === req.body.password){
        res.redirect("/" + client._id + "/home");
      } else {
        res.redirect("/login");
      }
    }
  });
});

app.post("/register/submit", function(req, res){
  mongoDB.addClient(req.body.name, req.body.password, function(client){

    res.redirect("/" + client._id + "/home");
  });
  console.log(req.body.name);

});


function getCurrentTest(id) {
  for (var i = 0; i < testList.length; i++) {
    if (testList[i].uniqueId === id) {
      return testList[i];
    }
  }
}

function getResult(correct, total){
  let result="";
  if (total * 0.9 < correct){
    result = "Sveikinu išlaikius egzaminą!";
  } else {
    result = "Deja, egzamino neišlaikei."
  }
  return result;
}

function getIncorrect(questions){
  let incorrect = [];
  questions.forEach(function(question){
    if (question.pick == null){
      incorrect.push(question);
      return;
    }
    if (question.answers[question.pick].isCorrect != 1){
      incorrect.push(question);
    }
  });
  return incorrect;
}
