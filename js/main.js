$(document).ready(function() {

  // init datepicker
  $('#dp').datepicker({
    format: "mm/dd/yyyy",
    endDate: "Today",
    autoclose: true,
    todayHighlight: true
  }).datepicker('setDate', '0');

  // keep templates from caching
  $.ajaxSetup({
    cache: false
  });

  // define vars
  var articleLimit = 14;
  var rankedNews = {};
  var sortedRankedNews = {};
  var countryCode, orgCode, subOrgCode, dateCode, regionCode, firstParentOrgCode, secondParentOrgCode, firstChildOrgCode, secondChildOrgCode;
  var tweakRank = [];
  var html = "";

  // set click handler for form submit button
  $('button').on('click', function() {
    //  resetAllVars();
    var formType = $(this).data('form');
    submitForm(formType);
  });

      tooltipForNewRank();


  // bypass normal form submission
  function submitForm(status) {
    var form = document.getElementById('paraform');
    var formSubmit = form.submit; //save reference to original submit function
    form.onsubmit = function(e) {
      runForm(status);
      return false;
    };
  }


/*

potential code for future dynamic array search to add more organizations to the orgstructure.json

function searchOrgArray(num){
  $.getJSON("json/orgstructure.json", function(json) {
    return json.find(parseOrgArray,[num]);
  });
};

function parseOrgArray(element, index, array){
  console.log(array);
if(element.id === $(this)[0]){
  return element.desc;
  console.log('1');
} else if (typeof element.children !== 'undefined'){
    console.log('2');
    for (var key in element.children[index]) {
      if (element.children[index].hasOwnProperty(key)) {
          console.log('3');
        if(element.children[index].id === $(this)[0]){z
            console.log('4');
          return element.children[index].desc;
        } else {
            console.log('5');
          return "no match";
        }
      } else {
        console.log('6');
        return 'next';
      }
    }
  } else {
    console.log('7');
    return 'last';
  }
}
*/


  // tally form data 
  function runForm(status) {
    $('.parsed').empty();
    var formNumbers = $("form").serialize();
    $('.algorithm').html('');

    $.each(formNumbers.split('&'), function(index, elem) {
      var vals = elem.split('=');
      if (vals[0] == 'date') {
        vals[1] = decodeURIComponent(vals[1]);
        dateCode = vals[1];
      } else if (vals[0] == 'organization') {
        orgCode = vals[1];

        switch (orgCode) {
          case "9908839": //Retail Services
            firstParentOrgCode = '4463';
            firstParentTitle = 'Cards';
            secondParentOrgCode = '4462';
            secondParentTitle = 'GCB';    
            break;
          case "20497"://GCB O&T
            firstParentOrgCode = '4586';
            firstParentTitle = 'Retail Banking'
            secondParentOrgCode = '4462';
            secondParentTitle = 'GCB';
            break;
          case "6808"://CMPC
            firstParentOrgCode = '16312';
            firstParentTitle = 'Enterprise Infrastructure';
            secondParentOrgCode = '5497';
            secondParentTitle = 'Enterprise O&T';
            break;
          case "16312": // Enterprise Infrastructure
            firstParentOrgCode = '5497';
            firstParentTitle = 'Enterprise O&T';
            break;
          case "4462": // GCB
            firstChildOrgCode = '9908839';
            secondChildOrgCode = '4463';
            thirdChildOrgCode = '4586';
            fourthChildOrgCode = '20497';
            break;
          case "5497": //Enterprise O&T
            firstChildOrgCode = '16312';
            secondChildOrgCode = '6808';
            break;
          default:
        }
        orgTitle = vals[1];
      } else if (vals[0] == 'country') {
        countryCode = vals[1];

        // process for region codes
        $.getJSON("json/countries.json", function(json) {
           $.each(json, function(i, val) {
              if(val.TargetID === countryCode){
                regionCode = val.TargetRegion.toLowerCase();;
              }
           });
        });
      } else {
        // values for boosting rankings
        var x = vals[0].split('-');
        var y = x[0] + x[1];
        tweakRank[y] = (vals[1]) ? vals[1] : 1;
      }

    });
    if (status == "new") {
      rankArticlesWithNewAlgorithm();
    } else {
      rankArticlesWithOldAlgorithm();
    }
  }

  // parse date into ranking
  function dateToTimerank(dateString) {
    var rankedDate = {};
    var decodedSourceDate = decodeURIComponent(dateString);
    var sourceDateParts = decodedSourceDate.split(/[.,\/ -]/);
    var sourceDate = new Date(sourceDateParts[2], parseInt(sourceDateParts[0], 10) - 1, sourceDateParts[1], 0, 0, 0, 0);
    var sourceTimestamp = sourceDate.getTime() / 1000;

    var chosenDateParts = dateCode.split(/[.,\/ -]/);
    var chosenDate = new Date(chosenDateParts[2], parseInt(chosenDateParts[0], 10) - 1, chosenDateParts[1], 0, 0, 0, 0);
    var chosenTimestamp = chosenDate.getTime() / 1000;

    // if article publish date is equal to chosen date
    if (sourceTimestamp == chosenTimestamp) {
      rankedDate['ranking'] = 2;
      rankedDate['readable'] = "today";
    }
    // if article publish date was prior to chosen date
    else if (chosenTimestamp > sourceTimestamp) {
      var daysOff = chosenTimestamp - sourceTimestamp;
      var rank = daysOff / 86400; // divide by seconds in day to get days
      if (rank >= 1) {
        rankedDate['ranking'] = (rank * -1) + 2;
        if(rankedDate['ranking'] == 1){
          rankedDate['readable'] = "yesterday";
        } else {
          rankedDate['readable'] = rank + " days ago";
        }
      }
      // if article public date is in the future
    } else {
      rankedDate['ranking'] = -100;
      rankedDate['readable'] = "future";
    }
    return rankedDate;
  }

  // one day javascript will have strtocap
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // append tooltips showing ranking methodology to titles, courtesy of http://stackoverflow.com/posts/6629864/revisions
  function tooltipForNewRank() {
    $('body').append('<div class="tooltip"><div class="tipBody"></div></div>');
    var tip; // make it global
    $('a[title]').mouseover(function(e) { // no need to point to 'rel'. Just if 'a' has [title] attribute.
      tip = $(this).attr('title'); // tip = this title   
      $(this).attr('title', ''); // empty title
      $('.tooltip').fadeTo(100, 0.95).children('.tipBody').html(tip); // fade tooltip and populate .tipBody
    }).mousemove(function(e) {
      $('.tooltip').css('top', e.pageY + 10); // mouse follow!
      $('.tooltip').css('left', e.pageX + 20);
    }).mouseout(function(e) {
      $('.tooltip').hide(); // mouseout: HIDE Tooltip (do not use fadeTo or fadeOut )
      $(this).attr('title', tip); // reset title attr
    });
  }


/*****************************************/
/*           Old Algorithm               */
/*****************************************/

  function rankArticlesWithOldAlgorithm() {

    //global will always be the same - get first three global articles, sort by date
    //next is region - get first three of region, first three of country, sort by date
    //next is organization - get first three of lead, first three of sub, etc

    //sort the news into arrays: global, regional, and business
    $.getJSON("json/shortnews.json", function(json) {

      rankedNews['global'] = [];
      rankedNews['region'] = [];
      rankedNews['country'] = [];
      rankedNews['org'] = [];
      rankedNews['firstparentorg'] = [];
      rankedNews['secondparentorg'] = [];

      $.each(json, function(i, val) {

        var valTarget = val["TargetID"].toLowerCase();

        if (valTarget == 'global') {
          rankedNews['global'][i] = val;
        } else if (valTarget == countryCode) {
          rankedNews['country'][i] = val;
        } else if (valTarget == orgCode) {
          rankedNews['org'][i] = val;
        } else if (valTarget == regionCode) {
          rankedNews['region'][i] = val;
        } else if (valTarget == firstParentOrgCode) {
          rankedNews['firstparentorg'][i] = val;
        } else if (valTarget == secondParentOrgCode) {
          rankedNews['secondparentorg'][i] = val;
        }
      });
      sortOldRankedNews(rankedNews);
    });
  }


  function sortOldRankedNews(rankedNews){

    /* potential code for rank and date sorting of old algorithm

     var oldRankedNews = {};

      $.each(rankedNews, function(j, item) {

            for (var key in item) {
          if (item.hasOwnProperty(key)) {  
                    var i = 0;

            thisVal = item[key];

          //set rank value
          var valRank = thisVal['Rank'];

          if (valRank <= 3 && valRank != 999) {
            valRank = (valRank * -1) + 4;
            var valRank = valRank;
          } else {
            var valRank = 0;
          }

          //set date rank value
          var valDate = thisVal["SourceDate"];
          valDate = dateToTimerank(valDate);
          var valDate = Math.round(valDate);

          //add values and create new object with them as keys
          var total = valRank + valDate;
          var totalSafe = total + 500 + "+" + i; // account for negative numbers, don't kill me

          oldRankedNews[j][totalSafe]["totalRank"] = totalSafe;
          i++;

        };
      };

      });*/

  displayInOldTemplate(rankedNews);

 };

  // parse news articles according to old algorithm and section into columns
  function displayInOldTemplate(articles) {

    $('.parsed').load('templates/template_old.html', function() {

      $.each(articles, function(section, val) {

        i = 0;
        for (var key in val) {
          if (val.hasOwnProperty(key)) {  
            thisVal = val[key];

            title = thisVal['Headline'];
            date = thisVal['SourceDate'];
            text = thisVal['AbstractNews'];
            desc = thisVal['TargetDesc'];
            id = thisVal['TargetID'];

            sectionTitle = capitalizeFirstLetter(desc);

            if (title.length > 100) {
              title = $.trim(title).substring(0, 100).split(" ").slice(0, -1).join(" ") + "...";
            }
            if (text.length > 200) {
              text = $.trim(text).substring(0, 200).split(" ").slice(0, -1).join(" ") + "...";
            }

            $('.parsed .' + section + ' .headline:eq(' + i + ') a').html(title);
            $('.parsed .' + section + ' .date:eq(' + i + ')').html(date);
            $('.parsed .' + section + ' .text:eq(' + i + ')').html(text);
            $('.parsed .' + section + ' h3').html(sectionTitle);
            i++;

          }
          if (i > 2)
            break;
        }

      });
      // hide unfilled business org template elements
      $.each($('.parsed .headline a'), function(count, elem) {
        if ($(elem).html() === '') {
          $(this).parent('.headline').siblings('.more').hide();
        }
      });
      $.each($('.parsed h3'), function(count, elem) {
        if ($(elem).html() === '') {
          $(this).parent('.cont').hide();
        }
      });
    });
  }


/*****************************************/
/*           New Algorithm               */
/*****************************************/


  // get news and create array from json
  function rankArticlesWithNewAlgorithm() {
    var rankedNews = {};

    $.getJSON("json/shortnews.json", function(json) {
      $.each(json, function(i, val) {

        // check to make sure targetID is within acceptable array
        // for example, if CMPC and India are selected, only show the following types of articles:
        // Global, India, APAC, 6808 (CMPC), 16312 (Enterprise Infrastructure), 5497 (Enterprise O&T)
        // account for parent orgs including child orgs - if GCB is chosen, include Retail Banking and GCB O&T

        var valTarget = val["TargetID"].toLowerCase();

        if ($.inArray(valTarget, ['global', countryCode, regionCode, orgCode, firstParentOrgCode, secondParentOrgCode, firstChildOrgCode, secondChildOrgCode]) !== -1) {

          //set rank value
          var valRank = val["Rank"];
          if (valRank <= 3 && valRank != 999) {
            valRank = (valRank * -1) + 4;
            var valRank = valRank * tweakRank['ranktweak'];
          } else {
            var valRank = 0;
          }

          //set date rank value
          var origValDate = val["SourceDate"];
          var valReturnedDate = dateToTimerank(origValDate);
          var valReadable = valReturnedDate.readable;
          var valDate = valReturnedDate.ranking;
          valDate = Math.round(valDate);
          valDate = valDate * tweakRank['datetweak'];

          //set target rank value
          var valTarget = val["TargetID"].toLowerCase();

          //if global give a rank of 2
          if (valTarget == 'global') {
            var valTarget = 2 * tweakRank['globaltweak'];
          } else if (valTarget == countryCode) {
            var valTarget = tweakRank['countrytweak'];
          } else if (valTarget == orgCode) {
            var valTarget = tweakRank['leveltweak'];
          } else if (valTarget == regionCode) {
            var valTarget = tweakRank['regiontweak'];
          } else {
            var valTarget = 0;
          }

          //add values and create new object with them as keys
          var total = parseInt(valRank) + parseInt(valDate) + parseInt(valTarget);
          var totalSafe = total + 500 + "+" + i; // account for negative numbers
          rankedNews[totalSafe] = val;
          rankedNews[totalSafe]["totalRank"] = totalSafe;

          var tooltip =  "<b>" + valRank + "</b>: rank  is " + val["Rank"] + "<br />";
              tooltip += "<b>" + valDate + "</b>: date is " + valReadable + "<br />";
              tooltip += "<b>" + valTarget + "</b>: description is '" + val["TargetDesc"] + "'<br />";
              tooltip += valRank + " + " + valDate + " + " + valTarget + " = <b>" + total + "</b>";
          rankedNews[totalSafe]["tooltip"] = tooltip;
        };
      sortNewRankedNews(rankedNews);
    });
  });
};

  // sort the ranked articles
  function sortNewRankedNews(articles) {

    var sortedRankedNews = {};
    var sortableArticles = articles;
    var keys = [];
    var k, article;

    for (article in sortableArticles) {
      if (sortableArticles.hasOwnProperty(article)) {
        keys.push(article);
      }
    }

    keys.sort();
    keys.reverse();

    var len = keys.length;

    for (i = 0; i < len; i++) {
      k = keys[i];
      sortedRankedNews[i] = sortableArticles[k];
    }

    displayInNewTemplate(sortedRankedNews);
  }

  // take sorted array of articles and place in template
  function displayInNewTemplate(articles) {
    var j = 0;
    $('.parsed').empty().load('templates/template_new.html', function() {

      $.each(articles, function(i, val) {

        title = val['Headline'];
        date = val['SourceDate'];
        text = val['AbstractNews'];
        desc = val['TargetDesc'];
        id = val['TargetID'];

        tooltip = val['tooltip'];

        if (title.length > 100) {
          title = $.trim(title).substring(0, 100).split(" ").slice(0, -1).join(" ") + "...";
        }
        if (text.length > 200) {
          text = $.trim(text).substring(0, 200).split(" ").slice(0, -1).join(" ") + "...";
        }

        $('.parsed .headline:eq(' + i + ') a').prop('title', tooltip);
        $('.parsed .headline:eq(' + i + ') a').html(title);
        $('.parsed .date:eq(' + i + ')').html(date);
        $('.parsed .text:eq(' + i + ')').html(text);

      });
      tooltipForNewRank();

    });

  }

});