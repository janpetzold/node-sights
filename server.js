var express = require('express');
var routes = require('routes');
var stylus = require('stylus');

// load my controllers
var sightsController = require('./controllers/sightsController');

// load my modules
var geo = require('./server_modules/geo');

var app = express();

// configure app
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.locals.pretty = true;

  // this is necessary to handle POST requests properly
  app.use(express.bodyParser());

  // enable routing
  app.use(app.router);

  // this is needed to determine the clients IP address when we run the app with a service provider
  app.enable('trust proxy');

  // configure Stylus for processing css
  app.use(require('stylus').middleware({ src: __dirname + '/client' }));
  app.use(express.static(__dirname + '/client'));
  app.use(express.static(__dirname + '/cross_modules'));
});

// define the routes for all simple requests
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

// this one is more complex so we use the dedicated controller
app.post('/fetchSights', function (req, res) {
	sightsController.getSights(req, res);
});

// initialize port and IP depending on environment
var port = process.env.OPENSHIFT_NODEJS_PORT ||  process.env.OPENSHIFT_INTERNAL_PORT || 80;
var ip = process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP || '192.168.178.26';

console.log("IP is " + ip + ", port " + port);

app.listen(port, ip);