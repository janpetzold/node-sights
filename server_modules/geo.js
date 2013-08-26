var geoip = require('geoip-lite');
var mongodb = require('mongodb');

function openDbConnection(callback) {
	var dbHost = process.env.OPENSHIFT_MONGODB_DB_HOST || "127.0.0.1";
	var dbPort = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017;
	var dbServer = new mongodb.Server(dbHost, parseInt(dbPort, 10));

	var db = new mongodb.Db('app', dbServer, {w: 1});
	var dbUser = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
	var dbPass = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;

	db.open(function(err, db) {
		if(!err) {
			// use authentication on production system
			if(process.env.OPENSHIFT_MONGODB_DB_USERNAME) {
				db.authenticate(dbUser, dbPass, function(err) {
					if(!err) {
						console.log("Authenticated");
						callback(db);
					} else {
						console.log("Authentication failed");
						console.log(err);
					}
				});
			} else {
				callback(db);
			}
		} else {
			console.log("Could not connect to database");
			console.log(err);
		}
    });
}

function queryCities(db, latitude, longitude, callback) {
	var query = {'Location' : {'$near' : [latitude, longitude]}};
	var collection = db.collection('cities');

	collection.find(query).sort({'Population' : -1}).limit(1).toArray(function(err, city) {
		var result = {
			name : city[0]['AccentCity'],
			population : city[0]['Population']
		};
		db.close();
		callback(result);
	});
}

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

	openDbConnection(function(db) {
		if(db) {
			queryCities(db, latitude, longitude, function(result) {
				callback(result);
			});
		}
	});
}

exports.getGeoCoordinates = getGeoCoordinates;
exports.getCity = getCity;