const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/sailDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const clientSchema = new mongoose.Schema({
  name: String,
  password: String,
  testList: []
});

const Client = mongoose.model("client", clientSchema);

exports.getClient = function(name, callback){
    Client.findOne({name: name}, function(err, client){
      if (!err) {
        callback(client);
      }
    });
}

exports.addClient = function(name, pass, callback){
  const newClient = new Client({
    name: name,
    password: pass
  });
  newClient.save(function(err, client){
    console.log(client._id);
    callback(client);
  });
}
