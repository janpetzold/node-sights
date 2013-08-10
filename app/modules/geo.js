var geoip = require('geoip-lite');
var MongoClient = require('mongodb').MongoClient;


function getGeoCoordinates(req) {
	var ip = req.ip;
	
	if(req.ip === "127.0.0.1" || req.ip.split(".")[0] === "192") {
		ip = "77.185.62.21";
	}

	console.log("Fetching the geo coordinates for IP " + ip);

	var geo = geoip.lookup(ip);

	console.log("Lat/Lng is " + geo.ll);
	return geo.ll;
}

function getCity(latitude, longitude, callback) {
	// convert lat/lng to float
	latitude = parseFloat(latitude);
	longitude = parseFloat(longitude);

	MongoClient.connect('mongodb://127.0.0.1:27017/geo', function(err, db) {
		if(err) throw err;

		// constuct the query for the collection
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