////////////////// CONNECTING TO SQL DATABASE////////////////////////

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(__dirname + "/../SailingQuiz.db", (err) => {

  if (err) {
    console.log(error);
  } else {
    console.log("successfuly connected to db");
    console.log(__dirname);
  }
});

////////////////////////// SQL STATEMENTS////////////////////////////

const GET_QUESTIONS_STATEMENT = "SELECT * FROM question WHERE section_id = ?";
const GET_ANSWERS_STATEMENT = "SELECT * FROM answer WHERE question_id = ?";
const SECTION_STATEMENT = "SELECT * FROM section";
const GET_RANDOM_QUESTION = "SELECT * FROM question WHERE _id = ?";

///////////////////////// FUNCTIONS ////////////////////////////////


function Answer(answer, isCorrect) {
  this.answer = answer;
  this.isCorrect = isCorrect;

}

function Question(id, question, answers, picture, section) {
  this.id = id;
  this.question = question;
  this.answers = answers;
  this.picture = picture;
  this.pick = null;
  this.section = section
}

function getRandom(numberOfQuestions){
  const questionIds = [];
  for (var i = 0; i < numberOfQuestions; i++){
    questionIds.push(Math.ceil(Math.random() * 500));
  }
  return questionIds;
}

exports.getAnswersForRandomQuestions = function(questionsList){

  return new Promise((res, rej) => {

    let check = 0;
    questionsList.forEach((question, id) => {
      db.all(GET_ANSWERS_STATEMENT, [question.id], (err, answers) => {
        check++;
        if (err){
          console.log(err);
        } else {
          answers.forEach((answer) => {
            let entry = new Answer(answer.answer, answer.isTrue);
            question.answers.push(entry);
            if (check === questionsList.length){
              res(questionsList);
            }
          });
        }
      });
    });
  });
}

exports.getRandomQuestions = function() {
  return new Promise ((res, err) =>{
    const randomQuestions = [];
    let randomNumbers = getRandom(20);
    let numberOfQuestions = 0;

    console.log(randomNumbers);
    randomNumbers.forEach((id) => {
      db.get(GET_RANDOM_QUESTION, [id], (err, row) => {
        if (err){
          console.log("we have an error");
        } else {
          let image;
          if (row.picture != null) {
            image = row._id;
          } else {
            image = null;
          }

          let question = row.question;
          let answers = [];
          var randomQ = new Question(row._id, question, answers, image, row.section_id);
          randomQuestions.push(randomQ);
          if (randomNumbers.length === randomQuestions.length){
            res(randomQuestions);
          }
        }
      });
        console.log("randomNumbers length " + randomNumbers.length + " | randomQuestoins length " + randomQuestions.length);

      });
});
}

// exports.getQuestions = function(sectionId){
//   return new Promise((res, err) =>{
//
//     let listOfQuestions = [];
//     const id = parseInt(sectionId);
//
//     db.all(GET_QUESTIONS_STATEMENT, [id], function(err, rows) {
//       if (err){
//         console.log("WE HAVE AN ERROR " + err);
//       }
//       rows.forEach(function(row) {
//         console.log("fetching question");
//
//         let image;
//         if (row.picture != null) {
//           image = row._id;
//         } else {
//           image = null;
//         }
//
//         let question = row.question;
//         let answersFromDB = [];
//
//         db.all(GET_ANSWERS_STATEMENT, [row._id], function(err, answers) {
//           console.log(row._id);
//           console.log("fetching answer");
//           answers.forEach(function(answer) {
//             var entry = new Answer(answer.answer, answer.isTrue);
//             answersFromDB.push(entry);
//           });
//           if (listOfQuestions !== null){
//             console.log("callback start");
//             res(listOfQuestions);
//           } else {
//             err("Something went wrong");
//           }
//         });
//
//         var sailQuestion = new Question(question, answersFromDB, image);
//         listOfQuestions.push(sailQuestion);
//         printArray(listOfQuestions)
//       });
//
//
//     });
//   });
// }

function printArray(list){
  setTimeout(() => {
    list.forEach((item) => {
      console.log(item);
    });
    console.log("====================================================");
  }, 1)
}

exports.getSections = function() {

  return new Promise ((res, rej) => {
    let sections = [];
    db.all(SECTION_STATEMENT, function(err, rows) {
      if (!err){
        rows.forEach(function(row) {
          let section = {
            _id: row._id,
            name: row.name
          }
          sections.push(section);
        });
        console.log("hm?");
        res(sections);
      } else {
        rej("error in retrieving sections" + err);
      }

    });
  })
}

// exports.getSections = function(callback) {
//
//   let sections = [];
//   db.all(SECTION_STATEMENT, function(err, rows) {
//
//     rows.forEach(function(row) {
//       let section = {
//         _id: row._id,
//         name: row.name
//       }
//       sections.push(section);
//     });
//   });
//   setTimeout(function() {
//     callback(sections);
//   }, 100);
// }
