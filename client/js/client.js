/**
 * Client-side methods of the app. Mainly perform Geo-detection and displays location and number of
 * inhabitants. The current position is marked on the map and the most important sights around are
 * fetched and displayed as markers.
 *
 */

// single global variable
var app = {};

// controllers/namespace for the various actions
app.mapControl = {};
app.sightsControl = {};
app.browserGeoControl = {};
app.webworkerSightsControl = {};


// Configuration object for application-wide variables
app.config = (function() {
    var registry = {
        located : false,
        map : null,
        tileUrl : 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
        currentLatLng : [],
        geoLocation : false,
        webWorker : false,
        centralLayer : null,
        sightsLayer : null
    };
    return {
        get : function(key) {
            if( typeof registry[key] !== 'undefined') {
                return registry[key];
            } else {
                return false;
            }
        },
        set : function(key, value) {
            registry[key] = value;
        }
    };
})();

// code that is executed once HTML is rendered
app.init = function() {
	console.log("Client is ready");
	app.sightsControl.indicateDataLoaded();

	// check for client-side geolocation support
	if(navigator.geolocation) {
		app.config.set("geoLocation", true);
		$("#geoStatus").text("available");
	} else {
		app.config.set("geoLocation", false);
	}

	// check for Webworker support
	if(window.Worker) {
		app.config.set("webWorker", true);
		$("#wwStatus").text("available");
    }
	else {
		app.config.set("webWorker", false);
    }

	// start client-side geo-detection
	navigator.geolocation.getCurrentPosition(app.browserGeoControl.onLocationSuccess, app.browserGeoControl.onLocationError);

	// start timeout to handle geo detection failure / deny of browser detection
	var timeoutGeo = setTimeout("app.browserGeoControl.checkGeoPosition()", 3000);

	// initiate the map with OSM data
	var map = L.map('map');
	L.tileLayer(app.config.get("tileUrl"), {
		attribution : 'Map data &copy; OpenStreetMap contributors'
	}).addTo(map);

	// attach event listener to map (triggers whenever user changes position)
	map.on('moveend', function (e) {
		var latLng = app.mapControl.getCentralMapPosition();

		// set zoom level
		$("#zoomStatus").text(app.config.get("map").getZoom());

		// don't do anything if the position has not changed that much
		if(latLng[0] !== app.config.get("currentLatLng")[0] && latLng[1] !== app.config.get("currentLatLng")[1]) {
			var timeoutPosition = setTimeout("app.mapControl.setMap(" + latLng[0] + "," + latLng[1] + ")", 1500);
		}
	});

	app.config.set("map", map);
};

// initiate the map after position is detected and update information once position is changed
app.mapControl.setMap = function(latitude, longitude) {
	// get current zoom level
	var zoomLevel = app.config.get("map").getZoom();
	$("#zoomStatus").text(zoomLevel);

	var latLng = app.mapControl.getCentralMapPosition();

	if(latLng[0] === latitude && latLng[1] === longitude) {
		// get the current city name and population
		$.ajax({
			type: "GET",
			url: "/getCity",
			data: {
				latitude : latitude,
				longitude: longitude
			},
			success: function(city){
				var nameHtml = "<span class='highlightText'>" + city.name + "</span>";
				var popHtml = "<span class='highlightText'>" + city.population + "</span>";
				var msg = "It seems that you are in " + nameHtml + ", a place that has a population of about " + popHtml + " people.";
				$("#welcomeMsg").html(msg);
				$("#textBox").show();
			}
		});

		app.sightsControl.markPosition(latitude, longitude);

		// just fetch sights below a certain zoom level
		if(app.config.get("map").getZoom() > 12) {
			app.sightsControl.markSights(latitude, longitude);
		}
	}
};

// handler is called once latitude/longitude are known
app.mapControl.positionReceived = function(latitude, longitude) {
	$("#textBox").hide();

	app.config.set("located", true);
	app.config.set("currentLatLng", [latitude, longitude]);

	app.config.get("map").setView(new L.LatLng(latitude, longitude), 17);

	app.mapControl.setMap(latitude, longitude);
};

// determine the middle of the map
app.mapControl.getCentralMapPosition = function() {
	var map = app.config.get("map");

	var latitude = map.getCenter().lat;
	var longitude = map.getCenter().lng;
	
	return [latitude, longitude];
};

// get the X/Y coordinates (latitude/longitude) of all corner points from the map that is displayed
app.mapControl.getMapBoundingBox = function() {
	var map = app.config.get("map");
	return [map.getBounds().getSouthWest().lat, map.getBounds().getSouthWest().lng, map.getBounds().getNorthEast().lat, map.getBounds().getNorthEast().lng];
};

// draw circle to hightlight our current position
app.sightsControl.markPosition = function(latitude, longitude) {
	var map = app.config.get("map");

	var circle = L.circle([latitude, longitude], 35, {
		color: 'red',
		fillColor: '#f03',
		fillOpacity: 0.25
	});
	
	// put circle in layer so we can easily remove it later
	var centralLayer = L.layerGroup([circle]);

	if(app.config.get("centralLayer")) {
		map.removeLayer(app.config.get("centralLayer"));
	}
	
	app.config.set("centralLayer", centralLayer);

	centralLayer.addTo(map);
};

// set markers for all the "sights" around
app.sightsControl.markSights = function(latitude, longitude) {
	app.sightsControl.indicateLoadingData();

	if(app.config.get("sightsLayer")) {
		app.config.get("map").removeLayer(app.config.get("sightsLayer"));
	}

	var boundingBox = app.mapControl.getMapBoundingBox();

	// if Webworkers are supported, use them - otherwise fetch sights via server
	if(app.config.get("webWorker")) {
		// Initialize the Webworker
		var worker = new Worker('./sights.js');

		// add event listener to Webworker
		worker.addEventListener('message', app.webworkerSightsControl.onMsg, false);
		worker.addEventListener('error', app.webworkerSightsControl.onError, false);

		worker.postMessage(boundingBox);
	} else {
		// fetch sights from server-side when there is no webworker support
		$.ajax({
			type: "POST",
			url: "/fetchSights",
			data: {boundingBox : boundingBox},
			success: function(sights){
				app.sightsControl.markSightsInMap(sights);
			}
		});
	}
};

// iterate through the array of sights and mrk them on the map
app.sightsControl.markSightsInMap = function(sights) {
	var allSights = [];

	for (var item in sights) {
		var sight = L.marker([sights[item].lat,sights[item].lon]);
		sight.bindPopup(sights[item].name);
		allSights.push(sight);
	}
	
	var map = app.config.get("map");
	var sightsLayer = L.layerGroup(allSights);

	if(app.config.get("sightsLayer")) {
		map.removeLayer(app.config.get("sightsLayer"));
	}

	app.config.set("sightsLayer", sightsLayer);
	sightsLayer.addTo(map);

	app.sightsControl.indicateDataLoaded();
};

// show loading animation
app.sightsControl.indicateLoadingData = function() {
	$("#loadingIndicator").show();
};

// hide loading animation
app.sightsControl.indicateDataLoaded = function() {
	$("#loadingIndicator").hide();
};

// check if latitude and longitude have been detected already
app.browserGeoControl.checkGeoPosition = function() {
	if(!app.config.get("located")) {
		app.browserGeoControl.onLocationError();
	}
};

// users location has been detected
app.browserGeoControl.onLocationSuccess = function(position) {
	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;
	
	console.log('Latitude is ' + latitude + ' Longitude is ' + longitude);
	app.mapControl.positionReceived(latitude, longitude);
};

// location detection has failed or timed out
app.browserGeoControl.onLocationError = function() {
	console.log('Unable to retrieve the location on client-side - trying the server now...');

	$.get('/fetchPosition', function(latlng) {
		console.log('Server-side position received: ' + latlng);
		app.mapControl.positionReceived(latlng[0], latlng[1]);
	});
};

// error in Webworker
app.webworkerSightsControl.onError = function(e) {
	console.log("Error line " + e.lineno + " in " + e.filename + ", line #" + e.lineno + " Message: " + e.message);
};

// Webworker finished work and returns an array of sights
app.webworkerSightsControl.onMsg = function(e) {
	app.sightsControl.markSightsInMap(e.data);
};

$(app.init);