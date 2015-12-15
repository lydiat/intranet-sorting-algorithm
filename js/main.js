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
    var countryCode, orgCode, subOrgCode, dateCode, regionCode, firstParentOrgCode, secondParentOrgCode;
    var tweakRank = [];
    var html = "";


  // set click handler for form submit button
  $('button').on('click', function() {
  //  resetAllVars();
    var formType = $(this).data('form');
    submitForm(formType);
  });

  // bypass normal form submission
  function submitForm(status) {
    var form = document.getElementById('paraform');
    var formSubmit = form.submit; //save reference to original submit function
    form.onsubmit = function(e) {
      runForm(status);
      return false;
    };
  }

  // append tooltips based on titles to learn ranking for articles
  // courtesey of http://stackoverflow.com/posts/6629864/revisions
  function tooltipForNewRank(){
   $('body').append('<div class="tooltip"><div class="tipBody"></div></div>'); 
    var tip; // make it global
    $('a[title]').mouseover(function(e) { // no need to point to 'rel'. Just if 'a' has [title] attribute.
        tip = $(this).attr('title'); // tip = this title   
        $(this).attr('title','');    // empty title
        $('.tooltip').fadeTo(100, 0.9).children('.tipBody').html( tip ); // fade tooltip and populate .tipBody
    }).mousemove(function(e) {
        $('.tooltip').css('top', e.pageY + 10 ); // mouse follow!
        $('.tooltip').css('left', e.pageX + 20 );
    }).mouseout(function(e) {
        $('.tooltip').hide(); // mouseout: HIDE Tooltip (do not use fadeTo or fadeOut )
        $(this).attr( 'title', tip ); // reset title attr
    });
  }

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
      }
      else if (vals[0] == 'organization') {
        orgCode = vals[1];

        if (orgCode === '9908839'){ //Retail Services
          firstParentOrgCode = '4463';
          firstParentTitle = 'Cards';
          secondParentOrgCode = '4462';
          secondParentTitle = 'GCB';
        }
        else if (orgCode === '20497'){ //GCB O&T
          firstParentOrgCode = '4586';
          firstParentTitle = 'Retail Banking'
          secondParentOrgCode = '4462';
          secondParentTitle = 'GCB';
        }
        else if (orgCode === '6808') { //CMPC
          firstParentOrgCode = '16312';
          firstParentTitle = 'Enterprise Infrastructure';
          secondParentOrgCode = '5497';
          secondParentTitle = 'Enterprise O&T';
        }
        else if (orgCode === '16312' ){ // Enterprise Infrastructure
          firstParentOrgCode = '5497'
          firstParentTitle = 'Enterprise O&T';
        }
        orgTitle = vals[1];
      }

      else if (vals[0] == 'country') {
        countryCode = vals[1].toLowerCase();

        // process for region codes
        if ($.inArray(countryCode, ['ind', 'mys', 'hkg']) !== -1) {
          regionCode = "apac";
        } else if ($.inArray(countryCode, ['usa', 'can']) !== -1) {
          regionCode = "nam";
        } else {
          regionCode = "emea";
        }
      } 

      else {
        var x = vals[0].split('-');
        var y = x[0] + x[1];
        tweakRank[y] = (vals[1]) ?  vals[1] : 1;
      }

    });
    $('.parsed').empty();
    if (status == "new") {
      newRankNewsArticles();
    } else {
      oldRankNewsArticles();
    }
  }

  // parse date into ranking
  function dateToTimerank(dateString) {
    var decodedSourceDate = decodeURIComponent(dateString);
    var sourceDateParts = decodedSourceDate.split(/[.,\/ -]/);
    var sourceDate = new Date(sourceDateParts[2], parseInt(sourceDateParts[0], 10) - 1, sourceDateParts[1], 0, 0, 0, 0);
    var sourceTimestamp = sourceDate.getTime() / 1000;
    //console.log(dateString);

    var chosenDateParts = dateCode.split(/[.,\/ -]/);
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
    return rank
  }

  // get news and create array from json
  function newRankNewsArticles() {
    //console.log(tweakRank);

    $.getJSON("json/shortnews.json", function(json) {
      $.each(json, function(i, val) {

        //set rank value
        var valRank = val["Rank"];
        if (valRank <= 3 && valRank != 999) {
          valRank = (valRank * -1) + 4;
          var valRank = valRank * tweakRank['ranktweak'];
  //        console.log("valrank" + valRank);
        } else {
          var valRank = 0;
        }

        //set date rank value
        var valDate = val["SourceDate"];
        valDate = dateToTimerank(valDate);
        valDate = Math.round(valDate);
        var valDate = valDate * tweakRank['datetweak'];


        //set target rank value
        var valTarget = val["TargetID"].toLowerCase();

        //if global give a rank of 2
        if (valTarget == 'global') {
          var valTarget = 2 * tweakRank['globaltweak'];
        }
        //if target ID matches country or org, give rank of 1 or boost
        else if (valTarget == countryCode){
          var valTarget = tweakRank['countrytweak'];
        //  console.log(valTarget);
        } 
        else if (valTarget == orgCode){
          var valTarget = tweakRank['leveltweak'];
        } 
        else if (valTarget == regionCode){
           var valTarget = tweakRank['regiontweak'];
        }
        else {
           var valTarget = 0;
        }

        //add values and create new object with them as keys
        var total = valRank + valDate + valTarget;
        var totalSafe = total + 500 + "+" + i; // account for negative numbers
        rankedNews[totalSafe] = val;
        rankedNews[totalSafe]["totalRank"] = totalSafe;

        var tooltip = " rank " + valRank + " + date  " + valDate + " + target  " + valTarget + " = " + total;
        tooltip += " || Target Description is '" + val["TargetDesc"] + "'";
        rankedNews[totalSafe]["tooltip"] = tooltip;
      });
      sortRankedNews(rankedNews);
    });
  }

  function oldRankNewsArticles() {

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
        } else if(valTarget == firstParentOrgCode){
          rankedNews['firstparentorg'][i] = val;
        } else if(valTarget == secondParentOrgCode){
          rankedNews['secondparentorg'][i] = val;
        }
      });
      oldSortRankedNews(rankedNews);
    });
  }

  // parse news articles according to old algorithm and section into columns
  function oldSortRankedNews(articles) {

    $('.parsed').load('templates/template_old.html', function() {

      $.each(articles, function(section,val){

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
           // console.log(sectionTitle);

            if (title.length > 100) {
              title = $.trim(title).substring(0, 100).split(" ").slice(0, -1).join(" ") + "...";
            }
            if (text.length > 200) {
              text = $.trim(text).substring(0, 200).split(" ").slice(0, -1).join(" ") + "...";
            }

            $('.parsed .'+section+' .headline:eq(' + i + ') a').html(title);
            $('.parsed .'+section+' .date:eq(' + i + ')').html(date);
            $('.parsed .'+section+' .text:eq(' + i + ')').html(text);
            $('.parsed .'+section+' h3').html(sectionTitle);
            i++;

          }
          if (i > 2)
            break;
        }

      });
      $.each($('.headline a'), function(count, elem){
        if($(elem).html() === '') {
          $(this).parent('.headline').siblings('.more').hide();
        }
      });
      $.each($('.parsed h3'), function(count, elem){
        if($(elem).html() === ''){
          $(this).parent('.cont').hide();
        }
      });
    });
  }

  // one day javascript will have strtocap
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

  // sort the ranked articles
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

    displayInNewTemplate(sortedRankedNews);
  }

  // take sorted array of articles and place in template
  function displayInNewTemplate(articles) {
    var j = 0;

    $('.parsed').load('templates/template_new.html', function() {

      $.each(articles, function(i, val) {

        title = val['Headline'];
        date = val['SourceDate'];
        text = val['AbstractNews'];
        desc = val['TargetDesc'];
        id = val['TargetID'];
        //rank = val['totalRank'] - 500;
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