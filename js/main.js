$(document).ready(function() {


  // init datepicker
  $('#dp').datepicker({
    format: "mm/dd/yyyy",
    endDate: "Today",
    autoclose: true,
    todayHighlight: true
  });


  // define vars
  var articleLimit = 10;
  var rankedNews = {};
  var sortedRankedNews = {};
  var countryCode, orgCode, dateCode, regionCode;
  var html = "";



  // bypass normal form submission
  var form = document.getElementById('paraform');
  var formSubmit = form.submit; //save reference to original submit function
  form.onsubmit = function(e) {
    runForm();
    return false;
  };


  // set up click handler for parsing articles
  $('.parse').on('click', function(){
  	$('.parsed').empty();
 	rankNewsArticles();
  });


  // tally form data and display
  function runForm() {
  	$('.parsed').empty();
    var formNumbers = $("form").serialize();
    $('.algorithm').html('');
    $.each(formNumbers.split('&'), function(index, elem) {
      var vals = elem.split('=');
      if (vals[0] == 'date') {
        vals[1] = decodeURIComponent(vals[1]);
        dateCode = vals[1];
     }
      if (vals[0] == 'organization') {
         orgCode = vals[1];
      }
      if (vals[0] == 'country') {
      	countryCode = vals[1].toLowerCase();

          // account for region codes
          if ($.inArray(countryCode, ['IND','MYS','HKG'])){
            regionCode = "APAC";
          } else if ($.inArray(countryCode, ['US','CAN'])){
            regionCode = "NAM";
          } else {
            regionCode = "EMEA";
          };




      }
      if (vals[1]) {
        $('.algorithm').append(vals[0] + " = " + vals[1] + "<br />");
      }
    });
    $('.parse').fadeIn();
  };


  // parse date into ranking
  function dateToTimerank(dateString) {
    var decodedSourceDate = decodeURIComponent(dateString);
    var sourceDateParts = decodedSourceDate.split(/[.,\/ -]/);
    var sourceDate = new Date(sourceDateParts[2], parseInt(sourceDateParts[0], 10) - 1, sourceDateParts[1], 0, 0, 0, 0);
    var sourceTimestamp = sourceDate.getTime() / 1000;
console.log(dateString);

    var chosenTimeStamp = dateCode;
    var chosenDateParts = chosenTimeStamp.split(/[.,\/ -]/);
    var chosenDate = new Date(chosenDateParts[2], parseInt(chosenDateParts[0], 10) - 1, chosenDateParts[1], 0, 0, 0, 0);
    var chosenTimestamp = chosenDate.getTime() / 1000;

    // if article publish date is equal to chosen date
    if (sourceTimestamp == chosenTimestamp) {
      rank = 2;
    } 
    // if article publish date was prior to chosen date
    else if (chosenTimestamp > sourceTimestamp) {
      var daysOff = chosenTimestamp - sourceTimestamp;
      var rank = daysOff / 86400; // divide by seconds in day to get days
      if (rank > 1) {
        rank = (rank * -1) + 2;
      }
    // if article public date is in the future
    } else {
      rank = -100;
    }
    return rank;
  }


  // get news and create
  function rankNewsArticles() {
  	$('.parsed').empty();
    $.getJSON("json/shortnews.json", function(json) {
      $.each(json, function(i, val) {

        //set rank value
        var valRank = val["Rank"];
        if (valRank <= 3 && valRank != 999) {
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
        if (valTarget == 'global') {
          valTarget = 2;
        }
       
  

        //if target ID matches country or org, give rank of 1
        else if (valTarget == countryCode || valTarget == orgCode || valTarget == regionCode) {
          valTarget = 1;
        } else {
          valTarget = 0;
        }

        //add values and create new object with them as keys
        total = valRank + valDate + valTarget;
        console.log(val["Headline"] + ":");
        console.log(" rank " + valRank + " | date  " +  valDate  + " | target  " + valTarget + " | total " + total);

        totalSafe = total  + 500 + "+" + i; // account for negative numbers
        console.log(totalSafe);
        rankedNews[totalSafe] = val;
        rankedNews[totalSafe]["totalRank"] = totalSafe;
      });
      console.log(rankedNews);
      sortRankedNews(rankedNews);
    });
  }


  function sortRankedNews(articles) {
  	var keys = [];
    var k;
  	for(article in articles){
  		if (articles.hasOwnProperty(article)) {
  			keys.push(article);
  		}
  	}

  	keys.sort();
    keys.reverse();

  	var len = keys.length;

  	for (i = 0; i < len; i++) {
  	  k = keys[i];
  	  sortedRankedNews[i] = articles[k];
  	}
  	displayInTemplate(sortedRankedNews);
  }


  function displayInTemplate(articles){
    var j = 0;

  	$.each(articles, function(i, val){
  		j++;
  		title = val['Headline'];
  		date = val['SourceDate'];
  		text = val['AbstractNews'];
  		desc = val['TargetDesc'];
  		id = val['TargetID'];
  		rank = val['totalRank'] - 500;

  		html +="<div class='rank'>"+rank+"</div>";
  		html += "<h4>"+title+"</h4>";
  		html += "<span class='date'>"+date+"</span><br />";
  		html += "<span class='date'>"+id+"</span><br />";
  		html += "<span class='date'>"+desc+"</span><br />";
  		html += "<p class='text'>"+text+"</p>";

  		if (j == articleLimit)
        	return false;
  	});

  	$('.parsed').append(html);
  }


	function compareNumbers(a, b) {
		return a - b;
	}

});