/**
 * This module my be used on client- and server-side. It initiates a WebWorker which asynchronously fetches
 * sights data via Overpass API and returns that in JSON format inside an Array.
 */

// Workaround to detect if script is executed on node.js server or client-side
if(typeof process !== 'undefined') {
	console.log("Using sights module with node.js in version " + process.version);
	var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
} else {
	// Client-side WebWorker - initiate and listen for messages (=parameters)
	self.addEventListener('message', initClientWebWorker, false);
}

// build the URL for the API to fetch the sights data
function constructOverpassUrl(box) {
	var url = "http://overpass-api.de/api/interpreter?data=[out:json];(:PLACEHOLDER);out;";

	// use the following POI types - for details, see http://wiki.openstreetmap.org/wiki/Map_Features
	var sightTypes = ["tourism=museum", "tourism=artwork", "tourism=viewpoint", "tourism=attraction", "tourism=zoo", "leisure=park", "leisure=stadium", "historic=castle", "historic=city_gate", "historic=fort", "historic=monument", "leisure=beach_resort", "amenity=theatre", "amenity=townhall", "amenity=marketplace", "amenity=place_of_worship"];

	// construct the URL based on the boundingBox (coordinates of the browser window)
	var allGeoSights = "";
	for(var type in sightTypes) {
        allGeoSights = allGeoSights + "node[" + sightTypes[type] + "](" + box[0] + "," + box[1] + "," + box[2] + "," + box[3] + ");";
    }
	
	return url.replace(":PLACEHOLDER", allGeoSights);
}

// start the WebWorker from client
function initClientWebWorker(e) {
	// the parameter for latitude/longitude is inside e.data
	var sightsUrl = constructOverpassUrl(e.data);

	// now get the sights data
	fetchData(sightsUrl, function(xhr) {
		// process the response to get the 30 most important sights around
		var result = processOverpassResult(xhr.responseText);
		self.postMessage(result);

		// Close the worker
		self.close();
	});
}

// get the data from Overpass API via XHR
// no chance to use any jQuery here because WebWorkers have no DOM access
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
function processOverpassResult(data) {
	var result = [];
	
	var elements = JSON.parse(data).elements;
	
	// iterate through the results
	for(var i = 0; i < elements.length; i++) {
		// don't take any item without a name
		if(elements[i].tags.name) {
			// If there is an English name, take this one instead the default.
			if(elements[i].tags.hasOwnProperty('name:en')) {
				elements[i].tags.name = elements[i].tags['name:en'];
			}

			// measure relevance by the amount of tags for the current item
			var relevance = elements[i].tags.length;

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

// Define "exports" just for server-side
if(typeof exports !== 'undefined') {
    exports.constructOverpassUrl = constructOverpassUrl;
    exports.fetchData = fetchData;
    exports.processOverpassResult = processOverpassResult;
}