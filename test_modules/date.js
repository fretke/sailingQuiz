
exports.getDate = function(){
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  var h = addZero(today.getHours());
  var m = addZero(today.getMinutes());
  var s = addZero(today.getSeconds());

  today = yyyy +"-" + mm + '-' + dd + " | " + h + ":" + m;

  // let fakeDate = "2020-05-03 | 10:00"

  // return fakeDate;
  return today;
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}
