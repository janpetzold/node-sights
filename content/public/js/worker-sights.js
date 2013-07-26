// TODO: This does not work. Fetch the sights-data via AJAX in the client and use this to parse and sort the data.

var sightsUrl = 'http://overpass-api.de/api/interpreter?data=[out:json];node[tourism](:MINLAT,:MINLNG,:MAXLAT,:MAXLNG);out;';

function init(e) {
	var geoUrl = sightsUrl.replace(':MINLAT', e.data[0]).replace(':MINLNG', e.data[1]).replace(':MAXLAT', e.data[2]).replace(':MAXLNG', e.data[3]);

	// get the sights data from Overpass
	xhrLoad(geoUrl, function(xhr) {
		// return the response what we got
		self.postMessage(xhr.responseText);

		// Close the worker
		self.close();
	})
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
			callback(xhr);
		}	
	}
	xhr.open('GET', url, true);
	xhr.send('');
}

// Initiate the webworker
self.addEventListener('message', init, false);