$(document).ready(function() {

  // init datepicker
  $('#dp').datepicker({
    format: "mm/dd/yyyy",
    endDate: "Today",
    autoclose: true,
    todayHighlight: true
  });


$.ajaxSetup({
  cache: false
});

  // define vars
  var articleLimit = 14;

  var rankedNews = {};
  var sortedRankedNews = {};
  var countryCode, orgCode, dateCode, regionCode;
  var html = "";


  $('button').on('click', function(){
    var formType = $(this).data('form');
    submitForm(formType);
  });

  // bypass normal form submission
  function submitForm (status){

    var form = document.getElementById('paraform');
    var formSubmit = form.submit; //save reference to original submit function
    form.onsubmit = function(e) {
      runForm(status);
      return false;
    };
  }

  // set up click handler for parsing articles
  /*$('.parse').on('click', function() {
    $('.parsed').empty();
    rankNewsArticles();
  });*/

  // tally form data and display
  function runForm(status) {
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
        console.log(orgCode);
      }
      if (vals[0] == 'country') {
        countryCode = vals[1].toLowerCase();
console.log(countryCode);
        // account for region codes
        if ($.inArray(countryCode, ['IND', 'MYS', 'HKG'])) {
          regionCode = "APAC";
        } else if ($.inArray(countryCode, ['USA', 'CAN'])) {
          regionCode = "NAM";
        } else {
          regionCode = "EMEA";
        };

      }
      //if (vals[1]) {
      //  $('.algorithm').append(vals[0] + " = " + vals[1] + "<br />");
      //}
    });
   // $('.parse').fadeIn();
    $('.parsed').empty();
    if(status == "new"){
      newRankNewsArticles();
    } else {
      oldRankNewsArticles();
    }

  };

  // parse date into ranking
  function dateToTimerank(dateString) {
    var decodedSourceDate = decodeURIComponent(dateString);
    var sourceDateParts = decodedSourceDate.split(/[.,\/ -]/);
    var sourceDate = new Date(sourceDateParts[2], parseInt(sourceDateParts[0], 10) - 1, sourceDateParts[1], 0, 0, 0, 0);
    var sourceTimestamp = sourceDate.getTime() / 1000;
    //console.log(dateString);

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
  function newRankNewsArticles() {
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
        //console.log(val["Headline"] + ":");
        //console.log(" rank " + valRank + " | date  " + valDate + " | target  " + valTarget + " | total " + total);

        totalSafe = total + 500 + "+" + i; // account for negative numbers
        //console.log(totalSafe);
        rankedNews[totalSafe] = val;
        rankedNews[totalSafe]["totalRank"] = totalSafe;
      });
      //console.log(rankedNews);
      sortRankedNews(rankedNews);
    });
  }

  function oldRankNewsArticles(){

    //global will always be the same - get first three global articles, sort by date
    //next is region - get first three of region, first three of country, sort by date
    //next is organization - get first three of lead, first three of sub, etc

    //sort the news into arrays: global, regional, and business
    $.getJSON("json/shortnews.json", function(json) {

        rankedNews['global'] = [];
        rankedNews['region'] = [];
        rankedNews['country'] = [];
        rankedNews['org'] = [];

      $.each(json, function(i, val) {

        var valTarget = val["TargetID"].toLowerCase();

        if (valTarget == 'global') {
          rankedNews['global'][i] = val;
        } else if(valTarget ==  countryCode){
          rankedNews['country'][i] = val;
        } else if(valTarget == orgCode){
          rankedNews['org'][i] = val;
        } else if(valTarget == regionCode){
          rankedNews['region'][i] = val;
        }
      })
      oldSortRankedNews(rankedNews);
    });
  };

  function oldSortRankedNews(articles){
    $('.parsed').load('templates/template_old.html', function() {

        var x = articles['global'];

      var i = 0;

        for (var key in x) {
       if (x.hasOwnProperty(key)) {
        val = x[key];
    

          title = val['Headline'];
          date = val['SourceDate'];
          text = val['AbstractNews'];
          desc = val['TargetDesc'];
          id = val['TargetID'];

          if (title.length > 100) {
            title = $.trim(title).substring(0, 100).split(" ").slice(0, -1).join(" ") + "...";
          }  
          if (text.length > 200) {
            text = $.trim(text).substring(0, 200).split(" ").slice(0, -1).join(" ") + "...";
          }

          $('.parsed .headline:eq('+i+') a').html(title)
          $('.parsed .date:eq('+i+')').html(date)
          $('.parsed .text:eq('+i+')').html(text)

        };
        i++;
        if (i > 2)
          break;
    };
  });
};

  function sortRankedNews(articles) {
    var keys = [];
    var k;
    for (article in articles) {
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


  // take sorted array of articles and place in template
  function displayInTemplate(articles) {
    var j = 0;

  $('.parsed').load('templates/template_new.html', function() {

    $.each(articles, function(i, val) {

      title = val['Headline'];
      date = val['SourceDate'];
      text = val['AbstractNews'];
      desc = val['TargetDesc'];
      id = val['TargetID'];
      rank = val['totalRank'] - 500;

      if (title.length > 100) {
        title = $.trim(title).substring(0, 100).split(" ").slice(0, -1).join(" ") + "...";
      }  
      if (text.length > 200) {
        text = $.trim(text).substring(0, 200).split(" ").slice(0, -1).join(" ") + "...";
      }

      $('.parsed .headline:eq('+i+') a').html(title)
      $('.parsed .date:eq('+i+')').html(date)
      $('.parsed .text:eq('+i+')').html(text)

    });

  });

  }

});