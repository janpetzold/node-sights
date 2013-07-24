function onError(e) {
	console.log("Error line " + e.lineno + " in " + e.filename + ", line #" + e.lineno + " Message: " + e.message);
  }


function onMsg(e) {
	console.log("Worker message: " + e);
}

function onLocationSuccess(position) {
	located = true;

	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;
	
	//console.log('Latitude is ' + latitude + ' Longitude is ' + longitude);
	
	map.setView(new L.LatLng(latitude, longitude), 15);

	console.log(map.getBounds().getNorthEast());

	mapBoundingBox = [map.getBounds().getSouthWest().lat, map.getBounds().getSouthWest().lng, map.getBounds().getNorthEast().lat, map.getBounds().getNorthEast().lng];
	// console.log("Bounding box: " + mapBoundingBox);

	var sightsUrl = 'http://overpass-api.de/api/interpreter?data=[out:json];node[tourism](:MINLAT,:MINLNG,:MAXLAT,:MAXLNG);out;';
	sightsUrl = sightsUrl.replace(':MINLAT', mapBoundingBox[0]).replace(':MINLNG', mapBoundingBox[1]).replace(':MAXLAT', mapBoundingBox[2]).replace(':MAXLNG', mapBoundingBox[3]);
	// console.log(sightsUrl);
	
	var marker = L.marker([latitude, longitude]).addTo(map);

	initWorker(mapBoundingBox);
	
	// TODO: get city name / country / population dynamically > when the user moves!
};

function onLocationError() {
	alert('Unable to retrieve your location');
};

function checkGeoPosition() {
	if(!located) {
		onLocationError();
	}
}

function initWorker(box) {
	// current coordinates: 52.520014, 13.373006
	// Rectangle: 52.515,13.365,52.6,13.38
	worker.postMessage(box);
}

var located = false;

var map = L.map('map');
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution : 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

var worker = new Worker('js/worker-sights.js');

// add event listeneer to WebWorker
worker.addEventListener('message', onMsg, false);
worker.addEventListener('error', onError, false);

// start client-side geo-detection
navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);

// start timeout to handle geo detection failure / deny of detection
var t = window.setTimeout(checkGeoPosition, 2000);

// start the worker
console.log("Sending the coordinates...");

