//jshint esversion:6

function Answer(answer, isCorrect) {
  this.answer = answer;
  this.isCorrect = isCorrect;

}

function Question(question, answers, picture) {
  this.question = question;
  this.answers = answers;
  this.picture = picture;
  this.pick = null;
}

function Test(listOfQuestions, uniqueId, currentQuestion) {
  this.listOfQuestions = listOfQuestions;
  this.uniqueId = uniqueId;
  this.currentQuestion = currentQuestion;
}

const express = require("express");
const bodyParser = require("body-parser");

const app = express();


let uniqueId = 0;
let testList = [];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.listen(3000, function() {
  console.log("server is running on port 3000");
});

// app.get("/:id/:questionNumber", function(req, res) {
//   console.log(req.params);
// });

app.post("/next/:id", function(req, res) {
  var idOfRequest = parseInt(req.params.id);
  var action = req.body.button;
  console.log(req.body);
  var currentTest = getCurrentTest(idOfRequest);
  currentTest.listOfQuestions[currentTest.currentQuestion].pick = req.body.pick;
  // console.log("before aplying pick " + currentTest.listOfQuestions[currentTest.currentQuestion].pick);
  if (action === "next") {
    currentTest.currentQuestion++;
  } else if (action === "previous") {
    currentTest.currentQuestion--;
  } else {
    currentTest.currentQuestion = parseInt(action) - 1;
  }
  console.log("picture - " + currentTest.listOfQuestions[currentTest.currentQuestion].picture);
  res.render("index", {

    image: currentTest.listOfQuestions[currentTest.currentQuestion].picture,
    id: currentTest.uniqueId,
    question: currentTest.listOfQuestions[currentTest.currentQuestion],
    size: currentTest.listOfQuestions.length,
    questionNumber: currentTest.currentQuestion

  });
});
app.post("/result/:id", function(req, res) {
  let currentTest = getCurrentTest(parseInt(req.params.id));
  let correctAnswers = 0;
  console.log(currentTest.currentQuestion);
  currentTest.listOfQuestions.forEach(function(question) {
    console.log("The question is = " + question.question);
    // console.log("The pick is = " + question.pick);
    var chosenAnswer = question.pick;
    if (chosenAnswer == null) {
      console.log("there is no answer");
    } else if (question.answers[parseInt(chosenAnswer)].isCorrect == 1) {
      correctAnswers++;
    }
  });
  // currentTest.listOfQuestions.forEach(function(question) {
  //   console.log(question.answers[0].pick);
  //   if (question.pick === null) {
  //
  //   } else if (question.answers[parseInt(question.pick)].isCorrect === 1) {
  //     correctAnswers++;
  //   }
  // });
  res.send("Correct answers: " + correctAnswers);
});

app.get("/", function(req, res) {
  let currentQuestion = 0;
  let questionList = getQuestions();
  let test = new Test(questionList, uniqueId, currentQuestion);
  testList.push(test);

  setTimeout(function() {
    // console.log(testList[0].listOfQuestions[1].question);
    res.render("index", {
      image: test.listOfQuestions[currentQuestion].picture,
      id: uniqueId,
      question: test.listOfQuestions[currentQuestion],
      size: test.listOfQuestions.length,
      questionNumber: currentQuestion
    });
    uniqueId++;
  }, 1000);

});

function getQuestions() {
  let listOfQuestions = [];
  const sqlite3 = require("sqlite3").verbose();

  const getQuestions = "SELECT * FROM question WHERE section_id = 4";
  const getAnswers = "SELECT * FROM answer WHERE question_id = ?";

  const db = new sqlite3.Database("D:\\WebDevelpomentCourse\\Web Development\\SailingQuizOnline\\SailingQuiz.db", (err) => {

    if (err) {
      console.log(error);
    } else {
      console.log("successfuly connected to db");
    }
  });

  db.all(getQuestions, [], function(err, rows) {
    rows.forEach(function(row) {



      //  listOfQuestions.push(row.question);
      let image;
      if (row.picture != null){
        image = row._id;
      } else {
        image = null;
      }

      let question = row.question;
      let answersFromDB = [];
      db.all(getAnswers, [row._id], function(err, answers) {
        answers.forEach(function(answer) {

          var entry = new Answer(answer.answer, answer.isTrue);
          answersFromDB.push(entry);

        });
      });
      var sailQuestion = new Question(question, answersFromDB, image);
      listOfQuestions.push(sailQuestion);

    });

  });
  db.close();
  return listOfQuestions;
}

function getCurrentTest(id) {
  for (var i = 0; i < testList.length; i++) {
    if (testList[i].uniqueId === id) {
      return testList[i];
    }
  }
}
