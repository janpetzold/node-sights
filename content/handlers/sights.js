// TODO: This does not work. Fetch the sights-data via AJAX in the client and use this to parse and sort the data.

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

function getSights(boundingBox) {
	console.log("Fetching the sights from server - bounding box is " + boundingBox);

	var sightsUrl = 'http://overpass-api.de/api/interpreter?data=[out:json];node[tourism](:MINLAT,:MINLNG,:MAXLAT,:MAXLNG);out;';
	var geoUrl = sightsUrl.replace(':MINLAT', boundingBox[0]).replace(':MINLNG', boundingBox[1]).replace(':MAXLAT', boundingBox[2]).replace(':MAXLNG', boundingBox[3]);

	xhrLoad(geoUrl, function(xhr) {
		console.log("DATA");
		return xhr.responseText;
	});

	console.log("DONE");
}

function sightsFetched(data) {

}

function xhrLoad(url, callback) {
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
			console.log("XHR successful");
			callback(xhr);
		}	
	}

	xhr.open('GET', url, true);
	xhr.send('');
}

exports.getSights = getSights;