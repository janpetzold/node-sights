function onError(e) {
	console.log("Error line " + e.lineno + " in " + e.filename + ", line #" + e.lineno + " Message: " + e.message);
  }


function onMsg(e) {
	var data = JSON.parse(e.data);
	console.log(data.elements);
}

function onLocationSuccess(position) {
	located = true;

	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;
	
	console.log('Latitude is ' + latitude + ' Longitude is ' + longitude);
	
	setMap(latitude, longitude);;
};

function onLocationError() {
	console.log('Unable to retrieve the location on client-side - trying the server now...');

	$.get('/fetchPosition', function(latlng) {
		located = true;
		setMap(latlng[0], latlng[1])
	});
};

function checkGeoPosition() {
	if(!located) {
		onLocationError();
	}
}

function setMap(latitude, longitude) {
	map.setView(new L.LatLng(latitude, longitude), 17);

	console.log(map.getBounds().getNorthEast());

	mapBoundingBox = [map.getBounds().getSouthWest().lat, map.getBounds().getSouthWest().lng, map.getBounds().getNorthEast().lat, map.getBounds().getNorthEast().lng];
	// console.log("Bounding box: " + mapBoundingBox);

	/*
	var sightsUrl = 'http://overpass-api.de/api/interpreter?data=[out:json];node[tourism](:MINLAT,:MINLNG,:MAXLAT,:MAXLNG);out;';
	sightsUrl = sightsUrl.replace(':MINLAT', mapBoundingBox[0]).replace(':MINLNG', mapBoundingBox[1]).replace(':MAXLAT', mapBoundingBox[2]).replace(':MAXLNG', mapBoundingBox[3]);
	console.log(sightsUrl);
	*/
	
	var marker = L.marker([latitude, longitude]).addTo(map);

	getSights(latitude, longitude, mapBoundingBox);
}

function getSights(latitude, longitude, mapBoundingBox) {
	// current coordinates: 52.520014, 13.373006
	// Rectangle: 52.515,13.365,52.6,13.38

	/*
	http://overpass-api.de/api/interpreter?data=[out:json];(node[historic](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771);node[tourism](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771);node[amenity=theatre](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771);node[amenity=townhall](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771);node[amenity=marketplace](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771);node[amenity=place_of_worship](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771);node[shop=art](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771);node[shop=craft](51.51346558530626,13.394941091537476,52.51993564618898,13.40506911277771););out;
	*/

	// fetch sights from server
	// console.log("Fetching nearby sights from server - bounding box: " + mapBoundingBox);

	$.ajax({
		type: "POST",
		url: "/fetchSights",
		data: {boundingBox : mapBoundingBox},
		success: function(data){
			console.log(JSON.parse(data));
		}
	});

	// initialize the WebWorker
	// worker.postMessage(mapBoundingBox);
}

var located = false;

var map = L.map('map');
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution : 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

var worker = new Worker('js/worker-sights.js');

// add event listener to WebWorker
worker.addEventListener('message', onMsg, false);
worker.addEventListener('error', onError, false);

// start client-side geo-detection
navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);

// start timeout to handle geo detection failure / deny of detection
var t = window.setTimeout(checkGeoPosition, 2000);

// start the worker
console.log("Sending the coordinates...");