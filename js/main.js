

$( document ).ready(function() {

	$('#dp').datepicker();

	var country = ['UK', 'US', 'Canada', 'India', 'Malaysia', 'Hong Kong'];
	var organization = ['GPA', 'Enterprise O&T', 'GCB', 'Retail Services', 'GCB O&T','CMPC', 'Enterprise Infrastructure'];

	$('.new').on('click', function(){
		var formNumbers = $( "form" ).serialize();
		console.log( formNumbers);

	});


});