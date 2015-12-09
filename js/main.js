$(document).ready(function() {

// init datepicker
  $('#dp').datepicker({
    format: "mm/dd/yyyy",
    endDate: "Today",
    autoclose: true,
    todayHighlight: true
  });

var countryCode = 'hkg';
var orgCode = '4462';

// bypass normal form submission
  var form = document.getElementById('paraform');
  var formSubmit = form.submit; //save reference to original submit function
  form.onsubmit = function(e) {
    runForm();
    return false;
  };

//$('.parse').on('click', function(){
	sortNews();
//})

// tally form data and display
  function runForm() {
    var formNumbers = $("form").serialize();
    $('.algorithm').html('');
    $.each(formNumbers.split('&'), function(index, elem) {
      var vals = elem.split('=');
      if (vals[0] == 'date') {
        vals[1] = dateToTimerank(vals[1]);
      }
      if (vals[0] == 'organization'){
      	var orgCode = vals[1];
      }
      if(vals[0] == 'country'){
      	var countryCode = vals[1].toLowerCase();

      }
      console.log(vals[0] + " = " + vals[1]);
      if (vals[1]) {
        $('.algorithm').append(vals[0] + " = " + vals[1] + "<br />");
      }
    });
    $('.parse').fadeIn();
  };


// parse date into ranking
  function dateToTimerank(dateString) {

    var dateParts = dateString.split(/[.,\/ -]/),

    date = new Date(dateParts[2], parseInt(dateParts[0], 10) - 1, dateParts[1], 0, 0, 0, 0);
    var chosenTimestamp = date.getTime() / 1000;

    var todayTimeStamp = new Date();
    todayTimeStamp.setHours(0, 0, 0, 0);
    todayTimeStamp = todayTimeStamp.getTime() / 1000;

    if (todayTimeStamp == chosenTimestamp) {
      rank = 2;
    } else {
      var daysOff = todayTimeStamp - chosenTimestamp;
      var rank = daysOff / 86400; // divide by seconds in day to get days
      if (rank > 1) {
        rank = (rank * -1) + 2;
      }
    }
    return rank;
  }
	
	var myNewArray = {};

  // get news and create
function sortNews(){
	$.getJSON("shortnews.json", function(json) {
		$.each(json, function(i, val) {
			//set rank value
			var valRank = val["Rank"];
			if(valRank <= 3){
				valRank = (valRank * -1) + 4;
			} else {
				valRank = 0;
			}

			//set date rank value
			var valDate = val["SourceDate"];
			var valDate = dateToTimerank(valDate);
			var valDate = Math.round(valDate);


			//set target rank value
			var valTarget = val["TargetID"].toLowerCase();
			//if global give a rank of 2
			if(valTarget == 'global'){
				valTarget = 2;
			} 
			//if target ID matches country or org, give rank of 1
			else if (valTarget == countryCode || valTarget == orgCode){
				valTarget = 1;
			}
			else {
				valTarget = 0;
			}

			total = valRank + valDate + valTarget;
			console.log(total);

			myNewArray[total] = val;

		});
	console.log(myNewArray);
	});
}

});