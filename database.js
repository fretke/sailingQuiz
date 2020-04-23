////////////////// CONNECTING TO SQL DATABASE////////////////////////

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(__dirname + "/SailingQuiz.db", (err) => {

  if (err) {
    console.log(error);
  } else {
    console.log("successfuly connected to db");
  }
});

////////////////////////// SQL STATEMENTS////////////////////////////

const GET_QUESTIONS_STATEMENT = "SELECT * FROM question WHERE section_id = ?";
const GET_ANSWERS_STATEMENT = "SELECT * FROM answer WHERE question_id = ?";
const SECTION_STATEMENT = "SELECT * FROM section";

///////////////////////// FUNCTIONS ////////////////////////////////


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

exports.getQuestions = function(sectionId, callback) {
  let listOfQuestions = [];
  const id = parseInt(sectionId);

  db.all(GET_QUESTIONS_STATEMENT, [id], function(err, rows) {
    if (err){
      console.log("WE HAVE AN ERROR " + err);
    }
    rows.forEach(function(row) {

      let image;
      if (row.picture != null) {
        image = row._id;
      } else {
        image = null;
      }

      let question = row.question;
      let answersFromDB = [];
      db.all(GET_ANSWERS_STATEMENT, [row._id], function(err, answers) {
        answers.forEach(function(answer) {
          var entry = new Answer(answer.answer, answer.isTrue);
          answersFromDB.push(entry);
        });
      });
      var sailQuestion = new Question(question, answersFromDB, image);
      listOfQuestions.push(sailQuestion);
    });
  });

  setTimeout(function() {
    callback(listOfQuestions);
  }, 100);
}

exports.getSections = function(callback) {

  let sections = [];
  db.all(SECTION_STATEMENT, function(err, rows) {

    rows.forEach(function(row) {
      let section = {
        _id: row._id,
        name: row.name
      }
      sections.push(section);
    });
  });
  setTimeout(function() {
    callback(sections);
  }, 100);
}
