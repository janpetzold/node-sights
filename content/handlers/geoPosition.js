var geoip = require('geoip-lite');

function getGeoCoordinates(req) {
	var ip = req.ip;
	
	if(req.ip === "127.0.0.1") {
		ip = "77.185.62.21";
	}

	console.log("Fetching the geo coordinates for IP " + ip);

	var geo = geoip.lookup(ip);

	console.log("Lat/Lng is " + geo.ll);
	return geo.ll;
}

exports.getGeoCoordinates = getGeoCoordinates;