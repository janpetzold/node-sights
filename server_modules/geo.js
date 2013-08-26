var geoip = require('geoip-lite');
var mongodb = require('mongodb');

// Connect to the database and initiate the query on success
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

// Execute the database query after the connection has been established
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

// Get latitude/longitude for a given IP
function getGeoCoordinates(req) {
	var ip = req.ip;

    // This is just for local testing / debugging
	if(req.ip === "127.0.0.1" || req.ip.split(".")[0] === "192") {
		ip = "77.185.62.21";
	}

	var geo = geoip.lookup(ip);

	console.log("Server detected Lat/Lng for IP " + ip + " is " + geo.ll);
	return geo.ll;
}

// Retrieve the city metadata (name and population) by querying the database.
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