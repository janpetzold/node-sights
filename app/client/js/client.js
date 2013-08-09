var app = {};
app.mapControl = {};
app.sightsControl = {};

// TODO: Create configuration object
var located = false;
var centralLayer;
var sightsLayer;
var geoLocation = false;
var webWorker = false;

app.init = function() {
	console.log("Client is ready");

	// check for client-side geolocation support
	if(navigator.geolocation) {
		geoLocation = true;
		$("#geoStatus").text("available");
	} else {
		geoLocation = false;
	}

	// check for WebWorker support
	if(window.Worker) {
		webWorker = true;
		$("#wwStatus").text("available");
    }
	else {
		webWorker = false;
    }

	// start client-side geo-detection
	navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
};

// detect browser capabilities

// TODO: Migrate WebWorker handlers to dedicated object
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
	
	app.mapControl.setMap(latitude, longitude);;
};

function onLocationError() {
	console.log('Unable to retrieve the location on client-side - trying the server now...');

	$.get('/fetchPosition', function(latlng) {
		located = true;
		app.mapControl.setMap(latlng[0], latlng[1])
	});
};

function checkGeoPosition() {
	if(!located) {
		onLocationError();
	}
}

app.mapControl.setMap = function(latitude, longitude) {
	map.setView(new L.LatLng(latitude, longitude), 17);
	
	app.sightsControl.markPosition(latitude, longitude);
	app.sightsControl.markSights(latitude, longitude);
};



// draw circle to hightlight our current position
app.sightsControl.markPosition = function(latitude, longitude) {
	var circle = L.circle([latitude, longitude], 35, {
		color: 'red',
		fillColor: '#f03',
		fillOpacity: 0.25
	});
	
	// put circle in layer so we can easily remove it later
	centralLayer = L.layerGroup([circle]);
	centralLayer.addTo(map);
};

app.sightsControl.markSights = function(latitude, longitude) {
	var allSights = [];

	$.ajax({
		type: "POST",
		url: "/fetchSights",
		data: {boundingBox : app.mapControl.getMapBoundingBox()},
		success: function(sights){
			for (var item in sights) {
				// console.log(sights[item]['name'] + " has Lat " + sights[item]['lat']);
				var sight = L.marker([sights[item]['lat'], sights[item]['lon']]);
				sight.bindPopup(sights[item]['name']);
				allSights.push(sight);
			}
			sightsLayer = L.layerGroup(allSights);
			sightsLayer.addTo(map);

			app.sightsControl.dataLoaded();
		}
	});

	// initialize the WebWorker
	// worker.postMessage(mapBoundingBox);
};



var map = L.map('map');
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution : 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

map.on('moveend', function (e) {
	var latLng = app.mapControl.getCentralMapPosition();

	var timeout = setTimeout("app.mapControl.setNewPosition(" + latLng[0] + "," + latLng[1] + ")", 1500);
});

app.mapControl.setNewPosition = function( latitude, longitude ) {
	// check map position again to see if the position is still the same - if yes, load the sights again
	var latLng = app.mapControl.getCentralMapPosition();

	if(latLng[0] === latitude && latLng[1] === longitude) {
		console.log("Getting sights again");
		app.sightsControl.loadData();

		// remove all the old layers
		map.removeLayer(centralLayer);
		map.removeLayer(sightsLayer);

		app.sightsControl.markPosition(latitude, longitude);
		app.sightsControl.markSights(latitude, longitude);
	} else {
		// console.log("Too many changes, waiting for position fix");
	}
};

app.mapControl.getCentralMapPosition = function() {
	var latitude = map.getCenter()['lat'];
	var longitude = map.getCenter()['lng'];
	return [latitude, longitude];
};

app.mapControl.getMapBoundingBox = function() {
	return [map.getBounds().getSouthWest().lat, map.getBounds().getSouthWest().lng, map.getBounds().getNorthEast().lat, map.getBounds().getNorthEast().lng];
};

app.sightsControl.loadData = function() {
	$("#loadingIndicator").show();
};

app.sightsControl.dataLoaded = function() {
	$("#loadingIndicator").hide();
};

var worker = new Worker('js/worker-sights.js');

// add event listener to WebWorker
worker.addEventListener('message', onMsg, false);
worker.addEventListener('error', onError, false);



// start timeout to handle geo detection failure / deny of detection
var t = window.setTimeout(checkGeoPosition, 3000);

// start the worker
console.log("Sending the coordinates...");








$( app.init );