var express = require('express');
var routes = require('routes');
var stylus = require('stylus');

// load my controllers
var sightsController = require('./controllers/sightsController');

// load my modules
var geo = require('./modules/geo');
var sights = require('./modules/sights');

var app = express();

// configure app
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.locals.pretty = true;

  // this is necessary to handle POST requests properly
  app.use(express.bodyParser());

  app.use(require('stylus').middleware({ src: __dirname + '/client' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/client'));
});

// define the routes for all requests
app.get('/', function (req, res) {
  res.render('map', {
	msg : 'Please allow us to detect your position...',
	ip : req.ip
 });
});

app.get('/fetchPosition', function (req, res) {
	res.send(geo.getGeoCoordinates(req));
});

// this one is more complex so we use a dedicated controller
app.post('/fetchSights', function (req, res) {
	sightsController.getSights(req, res);
});

// initialize app
var port = process.env.PORT || 80;
app.listen(port);
console.log("Listening on port " + port);