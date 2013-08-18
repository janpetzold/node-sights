/**
 * This module my be used on client- and server-side. It initiates a Webworker which asynchronously fetches
 * sights data via Overpass API and returns that in JSON format inside an Array.
 */

// Workaround to detect if script is executed on node.js server or client-side
if(typeof process !== 'undefined') {
	console.log("Using sights module with node.js in version " + process.version);
	var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
} else {
	// Client-side webworker - initiate and listen for messages (=parameters)
	self.addEventListener('message', initClientWebWorker, false);
}

// build the URL for the API to fetch the sights data
function constructUrl(box) {
	var url = "http://overpass-api.de/api/interpreter?data=[out:json];(:PLACEHOLDER);out;";

	// TEST - for Google Places:
	// https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyBjqseHE6gwDD348QWsuDkK279U8xU92Ew&location=52.51533619021745,13.380210399627686&radius=500&sensor=false&language=en&types=art_gallery|museum|church|city_hall|mosque|park|stadium|zoo|establishment

	// use the following POI types - for details, see http://wiki.openstreetmap.org/wiki/Map_Features
	var sightTypes = ["historic", "tourism", "amenity=theatre", "amenity=townhall", "amenity=marketplace", "amenity=place_of_worship", "shop=art", "shop=craft"];

	// construct the URL based on the boundingBox (coordinates of the brwoser window)
	var allGeoSights = "";
	for(var type in sightTypes) {
		allGeoSights = allGeoSights + "node[" + sightTypes[type] + "](" + box[0] + "," + box[1] + "," + box[2] + "," + box[3] +");";
	}
	
	return url.replace(":PLACEHOLDER", allGeoSights);
}

// start the Webworker from client
function initClientWebWorker(e) {
	// the parameter for the boundingBox is inside e.data
	var sightsUrl = constructUrl(e.data);

	// now get the sights data
	fetchData(sightsUrl, function(xhr) {
		// process the response to get the 30 most important sights around
		var result = processResult(xhr.responseText);
		self.postMessage(result);

		// Close the worker
		self.close();
	});
}

// get the data from Overpass API via XHR
// no chance to use any jQuery here because Webworkers have no DOM access
function fetchData(url, callback) {
	var xhr;

	if(typeof XMLHttpRequest !== 'undefined') {
		xhr = new XMLHttpRequest();
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
			}
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

// order the results by relevance and limit the amount to 30
function processResult(data) {
	var result = [];
	
	var elements = JSON.parse(data).elements;
	
	// iterate through the results
	for(i = 0; i < elements.length; i++) {
		// don't take any item without a name
		if(elements[i].tags.name) {
			// If there is an English name, take this one instead the default.
			if(elements[i].tags.hasOwnProperty('name:en')) {
				elements[i].tags.name = elements[i].tags['name:en'];
			}

			// measure relevance by the amount of tags for the current item
			var relevance = 0;
			for(var t in elements[i].tags) {
				relevance++;
			}

			// construct a new item based on the Overpass API JSON data
			var item = {
				relevance: relevance,
				lat: elements[i].lat,
				lon: elements[i].lon,
				name: elements[i].tags.name
			};

			result.push(item);
		}
	}

	// sort descending
	result.sort(compare);

	// limit array to 30 entries
	return result.splice(result, 30);
}

// helper method to compare two datasets from the sights data
function compare(a,b) {
	if (a.relevance < b.relevance) {
		return 1;
	}
	if (a.relevance > b.relevance) {
		return -1;
	}
	return 0;
}

// Defining "exports" is a little tricky if you want to work across browser / node.js
// Following the hint on http://caolanmcmahon.com/posts/writing_for_node_and_the_browser
(function(exports){
	exports.constructUrl = constructUrl;
	exports.fetchData = fetchData;
	exports.processResult = processResult;
})(typeof exports === 'undefined'? this['sights']={}: exports);