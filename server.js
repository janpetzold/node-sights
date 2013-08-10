var express = require('express');
var routes = require('routes');
var stylus = require('stylus');

// load my controllers
var sightsController = require('./controllers/sightsController');

// load my modules
var geo = require('./modules/geo');
var sights = require('./client/js/modules/sights');

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

app.get('/getCity', function (req, res) {
	geo.getCity(req.query.latitude, req.query.longitude, function(city) {
		res.send(city);
	});
});

// this one is more complex so we use a dedicated controller
app.post('/fetchSights', function (req, res) {
	sightsController.getSights(req, res);
});

// initialize app
var port = process.env.OPENSHIFT_NODEJS_PORT ||  process.env.OPENSHIFT_INTERNAL_PORT || 80;
var ip = process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP || '127.0.0.1';

console.log("IP is " + ip + ", port " + port);

app.listen(port, ip);