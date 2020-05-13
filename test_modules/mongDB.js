const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const form = require(__dirname + "/testForm.js")

mongoose.connect("mongodb://localhost:27017/sailDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const clientSchema = new mongoose.Schema({
  name: String,
  password: String,
  testData: [],
  distribution: []
});

const Client = mongoose.model("client", clientSchema);

exports.getClient = function(name, callback){
    Client.findOne({name: name}, function(err, client){
      if (!err) {
        callback(client);
      }
    });
}

exports.getClientById = function(id, callback){
  Client.findById(id, function(err, client){
      callback(client);

  });
}

exports.addClient = function(name, pass, callback){
  const newClient = new Client({
    name: name,
    password: pass,
    distribution: form.form
  });
  newClient.save(function(err, client){
    console.log(client._id);
    callback(client);
  });
}

exports.addOutcome = function(id, correct, numberOfQuestions, resultForm){
  let result = {
    time: date.getDate(),
    correctAnswers: correct,
    numberOfQuestions: numberOfQuestions,
  }
  Client.updateOne({_id: id}, {$push: {testData: result}}, function(err){
    if(err){
      console.log("was not able to add the test to client in mongoose");
    } else {
      console.log("added test successfuly");
    }
  });
  updateDistribution(id, resultForm);
}

function getClient(id, callback){
  Client.findById(id, function(err, client){
    if(!err){
        callback(client);
    }
  });
}

function updateDistribution(id, resultForm){

  getClient(id, function(client){
    // console.log(client.distribution);
    // console.log("===========================================");
    // console.log(resultForm);
    client.distribution.forEach((section, index) => {
      // console.log(index);
      resultForm.form[index].total += section.total;
      resultForm.form[index].correct += section.correct;
    });
    Client.updateOne({_id: id}, {$set:{distribution: resultForm.form}}, function(err){
      if (err){
        console.log("not able to update distrubtion");
      } else {
        console.log("updated distribution");
      }
    });
  });

}

exports.getStats = function(id){
  return new Promise ((res, rej) => {
    Client.findById(id, (err, client) => {
      if (!err){
        res(client);
      } else {
        rej("there was an error")
      }
    })
  })
}
