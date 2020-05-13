//jshint esversion:6

/////////////////MODULES, SET UP///////////////////////////////
const dataBase = require(__dirname + "/test_modules/database.js");
const mongoDB = require(__dirname + "/test_modules/mongDB.js");
const date = require(__dirname + "/test_modules/date.js");
const express = require("express");
const bodyParser = require("body-parser");
const form = require(__dirname + "/test_modules/testForm.js")

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

/////////////////// LOGIN /////////////////////////////


app.get("/login", function(req, res) {
  res.render("login", {
    path: "/login/submit",
    action: "Prisijungti",
    wantReg: "Sukurti paskyrą",
    remindPass: "Pamiršai slaptažodį?"
  });
});

app.get("/register", function(req, res) {
  res.render("login", {
    path: "/register/submit",
    action: "Registruotis",
    wantReg: "",
    remindPass: ""
  });
})

app.post("/login/submit", function(req, res) {
  mongoDB.getClient(req.body.name, function(client) {
    if (client) {
      if (client.password === req.body.password) {
        res.redirect("/" + client._id + "/home");
      } else {
        res.render("login_incorrect", {
          notice: "Neteisingai įvestas slaptažodis",
          path: "/login/submit",
          action: "Prisijungti",
          wantReg: "Sukurti paskyrą",
          remindPass: "Pamiršai slaptažodį?"
        });
      }
    } else {
      res.render("login_incorrect", {
        notice: "Nėra vartotojo tokiu vardu",
        path: "/login/submit",
        action: "Prisijungti",
        wantReg: "Sukurti paskyrą",
        remindPass: "Pamiršai slaptažodį?"
      });
    }
  });
});

app.post("/register/submit", function(req, res) {
  mongoDB.addClient(req.body.name, req.body.password, function(client) {

    res.redirect("/" + client._id + "/home");
  });
  console.log(req.body.name);

});

///////////////////// HOME PAGE ///////////////////////////////////

app.get("/:userId/home", function(req, res) {


  mongoDB.getClientById(req.params.userId, function(client) {

    if (client != null) {
      dataBase.getSections().then((sections) => {
        let numberOfQ = 0;
        let correctA = 0;
        client.testData.forEach((test) => {
          numberOfQ += test.numberOfQuestions;
          correctA += test.correctAnswers;
        })
        let percentage = Math.round(correctA / numberOfQ * 100.00);
        let chartDetails = getChartDetails(client.distribution)
        let lineChartDetails = getLineChartDetails(client.testData);

        res.render("home", {
          lineCartData: lineChartDetails.yAxis,
          lineChartLabels: lineChartDetails.xAxis,
          correctPercentage: percentage,
          name: client.name,
          color: chartDetails.color,
          data: chartDetails.correct,
          label: chartDetails.testSections,
          correct: correctA,
          incorrect: numberOfQ - correctA,
          customerId: req.params.userId,
          sections: sections
        });
      })
    } else {
      res.send("OOOPS, something wend wrong");
    }
  })

})

/////////////////////// GET QUESTIONS //////////////////////////////



app.get("/:userId/test/:number", function(req, res) {
    let currentQuestion = 0;
    dataBase.getRandomQuestions()
      .then((questionList) => {
        return dataBase.getAnswersForRandomQuestions(questionList)
      })
      .then((questionList) => {
        let test = new Test(questionList, uniqueId, currentQuestion);
        testList.push(test);

        res.render("index", {
          id: test.uniqueId,
          image: test.listOfQuestions[currentQuestion].picture,
          customerId: req.params.userId,
          question: test.listOfQuestions[currentQuestion],
          questionList: test.listOfQuestions,
          questionNumber: currentQuestion
        });
        uniqueId++;
      })
      .catch((err) => {
        console.log(err);
      });
});


///////////////////////////NAVIGATE TEST ////////////////////////////

app.post("/:userId/next/:id", function(req, res) {

  let userId = req.params.userId;
  var idOfRequest = parseInt(req.params.id);
  var action = req.body.button;
  console.log(req.body);
  var currentTest = getCurrentTest(idOfRequest);
  currentTest.listOfQuestions[currentTest.currentQuestion].pick = req.body.pick;

  console.log("Picture number = " + currentTest.listOfQuestions[currentTest.currentQuestion].picture);

  if ((currentTest.listOfQuestions.length - 1) === currentTest.currentQuestion && action === "next") {
    res.redirect("/" + userId + "/result/" + idOfRequest);
    return;
  }

  if (action === "next") {
    currentTest.currentQuestion++;
  } else if (action === "previous") {
    currentTest.currentQuestion--;
  } else {
    currentTest.currentQuestion = parseInt(action) - 1;
  }
  res.render("index", {

    customerId: userId,
    id: currentTest.uniqueId,
    question: currentTest.listOfQuestions[currentTest.currentQuestion],
    questionList: currentTest.listOfQuestions,
    questionNumber: currentTest.currentQuestion

  });
});

/////////////////////////RESULT PAGE//////////////////////////

app.get("/:userId/result/:id", function(req, res) {
  let userId = req.params.userId
  let testId = parseInt(req.params.id);
  let currentTest = getCurrentTest(testId);
  let numberOfQuestions = currentTest.listOfQuestions.length;
  let correctAnswers = 0;

  let currentResultForm = form.getForm();

  currentTest.listOfQuestions.forEach(function(question) {

    var chosenAnswer = question.pick;
    if (chosenAnswer != null && question.answers[parseInt(chosenAnswer)].isCorrect == 1) {
      correctAnswers++;
      currentResultForm.form[question.section - 1].total += 1;
      currentResultForm.form[question.section - 1].correct += 1;
    } else {
      currentResultForm.form[question.section - 1].total += 1;
    }
  });
  const percentage = correctAnswers / numberOfQuestions * 100;

  mongoDB.addOutcome(userId, correctAnswers, numberOfQuestions, currentResultForm);
  res.render("result", {
    resultMessage: getResult(correctAnswers, numberOfQuestions),
    correctAnswers: correctAnswers,
    totalQuestions: numberOfQuestions,
    userId: userId,
    percentage: percentage,
    id: testId
  });
});

/////////////////REVIEW MISTAKES PAGE/////////////////////////////////

app.get("/:userId/review/:id", function(req, res) {
  let testId = parseInt(req.params.id);
  let currentTest = getCurrentTest(testId);

  res.render("review", {
    questions: getIncorrect(currentTest.listOfQuestions),
    userId: req.params.userId
  });
});

app.get("/", function(req, res) {
  let data = [
    "locija",
    "dar kazkas",
    "locija",
    "dar kazkas",
    "locija",
    "dar kazkas",
  ]

  console.log(data[0]);
  res.render("chart", {
    label: data
  })
});

function getLineChartDetails(tests){
  let dates = [];
  let data = [];
  let percentages = [];
  let percentage = 0;

  tests.forEach((test, index) => {
    // percentage = Math.round(test.correctAnswers / test.numberOfQuestions * 100)
    let time = test.time.substr(0, test.time.indexOf(" "));
    if (dates === null){
      dates.push(time);
      let percentage = {
        correct: test.correctAnswers,
        total: test.numberOfQuestions
      };
      data.push(percentage);
    } else if (dates[dates.length - 1] === time){
      data[data.length-1].correct+= test.correctAnswers;
      data[data.length-1].total+= test.numberOfQuestions;
    } else if (dates[dates.length - 1] !== time){
      dates.push(time);
      let percentage = {
        correct: test.correctAnswers,
        total: test.numberOfQuestions
      };
      data.push(percentage);
    }
  });
  data.forEach((data) => {
    percentage = Math.round(data.correct / data.total * 100);
    percentages.push(percentage);
  })

  return {
    xAxis: dates,
    yAxis: percentages
  }
}



function getChartDetails(client){
  let sections = [];
  let percentOfCorrect = [];
  let backgroundColor =[];
  client.forEach((client) => {
    sections.push(client.name);
    let percent = client.correct / client.total * 100.00;
    percentOfCorrect.push(percent);
    if (percent < 50){
      backgroundColor.push("rgba(199, 0, 57, 0.4)")
    } else if (percent < 90){
      backgroundColor.push("rgba(255, 211, 29, 0.4)")
    } else {
      backgroundColor.push("rgba(6, 98, 59, 0.4)")
    }
  })
  return {
    testSections: sections,
    correct: percentOfCorrect,
    color: backgroundColor
  }
}


function getCurrentTest(id) {
  for (var i = 0; i < testList.length; i++) {
    if (testList[i].uniqueId === id) {
      return testList[i];
    }
  }
}

function getResult(correct, total) {
  let result = "";
  if (total * 0.9 < correct) {
    result = "Sveikinu išlaikius egzaminą!";
  } else {
    result = "Deja, egzamino neišlaikei."
  }
  return result;
}

function getIncorrect(questions) {
  let incorrect = [];
  questions.forEach(function(question) {
    if (question.pick == null) {
      incorrect.push(question);
      return;
    }
    if (question.answers[question.pick].isCorrect != 1) {
      incorrect.push(question);
    }
  });
  return incorrect;
}
