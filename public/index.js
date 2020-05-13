
  $(document).ready(function(){
    if ($(".userChoice")[0]){
      $(".userChoice").prop("checked", true);
    }

    const numberOfQuestions = $(".question-buttons").length;

    if ($(".active")[0].value == 1){
      $("#previous").prop("disabled", true);
    } else if ($(".active")[0].value == numberOfQuestions){
      $("#next").text("Baigti testą");
    }

  });

  $(".custom-control-input").click(function(event){
    $targetCheck = $(event.target);
     $targetCheck.addClass("pressed");

     $array =  $(".custom-control-input");

     for (var i = 0; i < $array.length; i++){
       if (!$array[i].classList.contains("pressed")){
          $array[i].checked = false;
       }
     }
    $targetCheck.removeClass("pressed");
  });
