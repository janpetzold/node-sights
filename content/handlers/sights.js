var xmlHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// TODO: put this into the client as well!
function constructUrl(box) {
	var url = "http://overpass-api.de/api/interpreter?data=[out:json];(:PLACEHOLDER);out;";

	// use the following POI types
	// for details, see http://wiki.openstreetmap.org/wiki/Map_Features
	var sightTypes = ["historic", "tourism", "amenity=theatre", "amenity=townhall", "amenity=marketplace", "amenity=place_of_worship", "shop=art", "shop=craft"];

	// construct the URL based on the boundingBox
	var allGeoSights = "";
	for(var type in sightTypes) {
		allGeoSights = allGeoSights + "node[" + sightTypes[type] + "](" + box[0] + "," + box[1] + "," + box[2] + "," + box[3] +");";
	}
	
	return url.replace(":PLACEHOLDER", allGeoSights);
}

function xhrLoad(url, callback) {
	var xhr;

	if(typeof xmlHttpRequest !== 'undefined') {
		xhr = new xmlHttpRequest();
	} else {
		var versions = ["MSXML2.XmlHttp.5.0",
			"MSXML2.XmlHttp.4.0",
			"MSXML2.XmlHttp.3.0",
			"MSXML2.XmlHttp.2.0",
			"Microsoft.XmlHttp"];

	for(var i = 0, len = versions.length; i < len; i++) {
		try {
			xhr = new ActiveXObject(versions[i]);
			break;
		}
		catch(e){}
			} // end for
		}

	xhr.onreadystatechange = ensureReadiness;

	function ensureReadiness() {
		if(xhr.readyState < 4) {
			return;
		}
		if(xhr.status !== 200) {
			return;
		} 
		// all is well
		if(xhr.readyState === 4) {
			callback(xhr);
		}	
	}

	xhr.open('GET', url, true);
	xhr.send('');
}

exports.constructUrl = constructUrl;
exports.xhrLoad = xhrLoad;