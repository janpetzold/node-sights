var geoip = require('geoip-lite');
var MongoClient = require('mongodb').MongoClient;

// setup db connect data - depends on dev/prod environment
var dbHost = "127.0.0.1";
var dbPort = "27017";

var mongoConnectString = "mongodb://" + dbHost + ":" + dbPort + "/geo";

if(typeof process.env.OPENSHIFT_MONGODB_DB_URL !== 'undefined') {
	mongoConnectString = process.env.OPENSHIFT_MONGODB_DB_URL + "/geo";
}

console.log("Connect string to Mongo is " + mongoConnectString);

function getGeoCoordinates(req) {
	var ip = req.ip;
	
	if(req.ip === "127.0.0.1" || req.ip.split(".")[0] === "192") {
		ip = "77.185.62.21";
	}

	console.log("Fetching the geo coordinates for IP " + ip);

	var geo = geoip.lookup(ip);

	console.log("Ser-detected Lat/Lng for IP is " + geo.ll);
	return geo.ll;
}

function getCity(latitude, longitude, callback) {
	// convert lat/lng to float
	latitude = parseFloat(latitude);
	longitude = parseFloat(longitude);

	MongoClient.connect(mongoConnectString, function(err, db) {
		if(err) throw err;

		console.log("Connection to Mongo on host " + dbHost + " with port " + dbPort + " successful");

		// construct the query for the collection
		var query = {'Location' : {'$near' : [latitude, longitude]}};
		var collection = db.collection('cities');

		collection.find(query).sort({Population : -1}).limit(1).toArray(function(err, city) {
			var result = {
				name : city[0]['AccentCity'],
				population : city[0]['Population']
			};
			db.close();
			callback(result);
      });
  });
}

exports.getGeoCoordinates = getGeoCoordinates;
exports.getCity = getCity;