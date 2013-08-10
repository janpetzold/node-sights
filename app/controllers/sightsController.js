var sights = require('./../client/js/modules/sights');

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

  sights.fetchData(serviceUrl, function(xhr) {
	var result = sights.processResult(xhr.responseText);
	
	stopBench(time, "fetchSightsViaOverpass");

	res.send(result);
  });
};