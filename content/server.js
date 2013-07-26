var express = require('express');

var app = express();

var io = require('socket.io').listen(app);

// this is necessary to handle POST requests properly
app.use(express.bodyParser());

var geoPosition = require('./handlers/geoPosition');
var sights = require('./handlers/sights');


// define the handlers
app.get('/fetchPosition', function(req, res) {
	res.send(geoPosition.getGeoCoordinates(req));
});

/*
app.post('/fetchSights', function(req, res) {
	var boundingBox = req.body.boundingBox;

	var result = sights.getSights(req.body.boundingBox);

	res.send(result);
});
*/

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 80;
app.listen(port);
console.log("Listening on port " + port);