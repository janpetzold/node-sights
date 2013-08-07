var express = require('express');
var _ = require('underscore');

var app = express();

// var io = require('socket.io').listen(app);

// this is necessary to handle POST requests properly
app.use(express.bodyParser());

var geoPosition = require('./handlers/geoPosition');
var sights = require('./handlers/sights');

var startBench = function() {
	return new Date().getTime();
};

var stopBench = function(time, purpose) {
	console.log("Operation " + purpose + " took " + (new Date().getTime() - time) + " ms.");
};


// define the handlers
app.get('/fetchPosition', function(req, res) {
	res.send(geoPosition.getGeoCoordinates(req));
});

app.post('/fetchSights', function(req, res) {
	var boundingBox = req.body.boundingBox;

	// var result = sights.getSights(req.body.boundingBox);

	var time = startBench();

	console.log("Fetching the sights from server - bounding box is " + boundingBox);

	// build the service-URL based on the boundingBox
	var serviceUrl = sights.constructUrl(boundingBox);
	//console.log("Service-URL is " + serviceUrl);

	sights.xhrLoad(serviceUrl, function(xhr) {
		console.log("OVERPASS-DATA RECEIVED");

		// TODO: Sort data and leave everything > 30
		var result = {};
		var elements = JSON.parse(xhr.responseText)['elements'];
		console.log("Insgesamt " + elements.length + " Elemente");
		for(i = 0; i < elements.length; i++) {

			// If there is an English name, take this one instead the default.
			if(elements[i]['tags'].hasOwnProperty('name:en')) {
				elements[i]['tags']['name'] = elements[i]['tags']['name:en'];
			}

			console.log(elements[i]['tags']['name'] + " has " + _.size(elements[i]['tags']) + " tags.");
		}

		// TODO: Order by the amount of tags

		stopBench(time, "fetchSightsViaOverpass");
		res.send(xhr.responseText);
	});

	// res.send(result);
});

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 80;
app.listen(port);
console.log("Listening on port " + port);