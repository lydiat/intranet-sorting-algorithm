

$( document ).ready(function() {

	$('#dp').datepicker({
		format: 'mm-dd-yyyy',
		autoclose:true,
		todayHighlight: true

	});

	var country = ['UK', 'US', 'Canada', 'India', 'Malaysia', 'Hong Kong'];
	var organization = ['GPA', 'Enterprise O&T', 'GCB', 'Retail Services', 'GCB O&T','CMPC', 'Enterprise Infrastructure'];

	$('.new').on('click', function(){
		var formNumbers = $( "form" ).serialize();

		$('.algorithm').html('');

		$.each(formNumbers.split('&'), function (index, elem) {
			var vals = elem.split('=');
			if(vals[0] == 'date'){
				vals[1] = dateToTimerank(vals[1]);
			}
			console.log(vals[0] + " = " + vals[1]);

			$('.algorithm').append(vals[0] + " = " + vals[1] + "<br />");
		});
		$('.parse').fadeIn();

	});

	function dateToTimerank(dateString){

		dateParts = dateString.split('-'),

		date = new Date(dateParts[2], parseInt(dateParts[0], 10) - 1, dateParts[1], 0, 0, 0, 0);
		chosenTimestamp = date.getTime()/1000;

		secondsInDay = 86400;

		var todayTimeStamp = new Date();
		todayTimeStamp.setHours(0,0,0,0);
		todayTimeStamp = todayTimeStamp.getTime()/1000;

		if(todayTimeStamp == chosenTimestamp) {
			rank = 2;
		} else {
			var daysOff = todayTimeStamp - chosenTimestamp;
			rank = daysOff / secondsInDay;
			if(rank > 1) {
				rank = (rank * -1) + 2;
			}
		}
		return rank;
	}

});