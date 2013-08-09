var sights = require('./../modules/sights');
var _ = require('underscore');

// Some helper functions to benchmark execution time
var startBench = function() {
	return new Date().getTime();
};

var stopBench = function(time, purpose) {
	console.log("Operation " + purpose + " took " + (new Date().getTime() - time) + " ms.");
};

var compare = function(a,b) {
	if (a.relevance < b.relevance) {
		return 1;
	}
	if (a.relevance > b.relevance) {
		return -1;
	}
	return 0;
};

exports.getSights = function(req, res){
  var boundingBox = req.body.boundingBox;
  console.log("Fetching the sights from server - bounding box is " + boundingBox);

  var time = startBench();

  // build the service-URL based on the boundingBox
  var serviceUrl = sights.constructUrl(boundingBox);
  //console.log("Service-URL is " + serviceUrl);

  var sightsArray = [];

  sights.xhrLoad(serviceUrl, function(xhr) {
	// console.log(xhr.responseText);
	var result = [];
	
	var elements = JSON.parse(xhr.responseText)['elements'];
	console.log("Insgesamt " + elements.length + " Elemente");
	

	for(i = 0; i < elements.length; i++) {
		// If there is an English name, take this one instead the default.
		if(elements[i]['tags'].hasOwnProperty('name:en')) {
			elements[i]['tags']['name'] = elements[i]['tags']['name:en'];
		}

		var relevance = _.size(elements[i]['tags']);

		// construct a new item based on the Overpass API JSON data
		var item = {
			relevance: relevance,
			lat: elements[i]['lat'],
			lon: elements[i]['lon'],
			name: elements[i]['tags']['name']
		};

		result.push(item);
	}

	// sort descending
	result.sort(compare);

	// limit array to 30 entries
	result = result.splice(result, 30);

	//console.log(result);
	stopBench(time, "fetchSightsViaOverpass");

	res.send(result);
  });
};