var app = {};
app.mapControl = {};
app.sightsControl = {};
app.browserServiceControl = {};
app.webworkerServiceControl = {};


// Configuration object for application-wide variables
app.config = (function() {
    var registry = {
        located : false,
        map : null,
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

	// check for WebWorker support
	if(window.Worker) {
		app.config.set("webWorker", true);
		$("#wwStatus").text("available");
    }
	else {
		app.config.set("webWorker", false);
    }

	// start client-side geo-detection
	navigator.geolocation.getCurrentPosition(app.browserServiceControl.onLocationSuccess, app.browserServiceControl.onLocationError);

	// start timeout to handle geo detection failure / deny of browser detection
	var timeoutGeo = setTimeout("app.browserServiceControl.checkGeoPosition()", 3000);

	// initiate the map with OSM data
	var map = L.map('map');
	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution : 'Map data &copy; OpenStreetMap contributors'
	}).addTo(map);

	// attach event listener to map (triggers whenever user changes position)
	map.on('moveend', function (e) {
		var latLng = app.mapControl.getCentralMapPosition();

		// don't do anything if the position has not changed that much
		if(latLng[0] !== app.config.get("currentLatLng")[0] && latLng[1] !== app.config.get("currentLatLng")[1]) {
			var timeoutPosition = setTimeout("app.mapControl.setNewPosition(" + latLng[0] + "," + latLng[1] + ")", 1500);
		}
	});

	app.config.set("map", map);
};

app.mapControl.setMap = function(latitude, longitude) {
	app.config.get("map").setView(new L.LatLng(latitude, longitude), 17);

	// get the current city name and population
	$.ajax({
		type: "GET",
		url: "/getCity",
		data: {
			latitude : latitude,
			longitude: longitude
		},
		success: function(city){
			var nameHtml = "<span class='highlightText'>" + city['name'] + "</span>";
			var popHtml = "<span class='highlightText'>" + city['population'] + "</span>";
			var msg = "It seems that you are in " + nameHtml + ", a place that has a population of about " + popHtml + " people.";
			$("#welcomeMsg").html(msg);
			$("#textBox").show();
		}
	});

	
	app.sightsControl.markPosition(latitude, longitude);
	app.sightsControl.markSights(latitude, longitude);
};

app.mapControl.positionReceived = function(latitude, longitude) {
	$("#textBox").hide();

	app.config.set("located", true);
	app.config.set("currentLatLng", [latitude, longitude]);

	app.mapControl.setMap(latitude, longitude);
};

app.mapControl.getCentralMapPosition = function() {
	var map = app.config.get("map");

	var latitude = map.getCenter()['lat'];
	var longitude = map.getCenter()['lng'];
	
	return [latitude, longitude];
};

app.mapControl.getMapBoundingBox = function() {
	var map = app.config.get("map");
	return [map.getBounds().getSouthWest().lat, map.getBounds().getSouthWest().lng, map.getBounds().getNorthEast().lat, map.getBounds().getNorthEast().lng];
};

app.mapControl.setNewPosition = function( latitude, longitude ) {
	// check map position again to see if the position is still the same - if yes, load the sights again
	var latLng = app.mapControl.getCentralMapPosition();

	if(latLng[0] === latitude && latLng[1] === longitude) {
		console.log("Getting sights again");
		app.sightsControl.inidicateLoadingData();

		// remove all the old layers
		var map = app.config.get("map");
		//map.removeLayer(app.config.get("centralLayer"));
		map.removeLayer(app.config.get("sightsLayer"));

		app.sightsControl.markPosition(latitude, longitude);
		app.sightsControl.markSights(latitude, longitude);

		app.config.set("currentLatLng", [latitude, longitude]);
	} else {
		// console.log("Too many changes, waiting for position fix");
	}
};

// draw circle to hightlight our current position
app.sightsControl.markPosition = function(latitude, longitude) {
	var circle = L.circle([latitude, longitude], 35, {
		color: 'red',
		fillColor: '#f03',
		fillOpacity: 0.25
	});
	
	// put circle in layer so we can easily remove it later
	var map = app.config.get("map");
	var centralLayer = L.layerGroup([circle]);

	if(app.config.get("centralLayer")) {
		map.removeLayer(app.config.get("centralLayer"));
	}
	
	app.config.set("centralLayer", centralLayer);

	centralLayer.addTo(map);
};

app.sightsControl.markSights = function(latitude, longitude) {
	//app.config.set("webWorker", false);

	var boundingBox = app.mapControl.getMapBoundingBox();

	// TODO: Don't display sights when bounding box is too large

	if(app.config.get("webWorker")) {
		// Initialize the WebWorker
		var worker = new Worker('js/modules/sights.js');

		// add event listener to WebWorker
		worker.addEventListener('message', app.webworkerServiceControl.onMsg, false);
		worker.addEventListener('error', app.webworkerServiceControl.onError, false);

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

app.sightsControl.markSightsInMap = function(sights) {
	var allSights = [];

	for (var item in sights) {
		// console.log(sights[item]['name'] + " has Lat " + sights[item]['lat']);
		var sight = L.marker([sights[item]['lat'], sights[item]['lon']]);
		sight.bindPopup(sights[item]['name']);
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

app.sightsControl.inidicateLoadingData = function() {
	$("#loadingIndicator").show();
};

app.sightsControl.indicateDataLoaded = function() {
	$("#loadingIndicator").hide();
};

app.browserServiceControl.checkGeoPosition = function() {
	if(!app.config.get("located")) {
		app.browserServiceControl.onLocationError();
	}
};

app.browserServiceControl.onLocationSuccess = function(position) {
	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;
	
	console.log('Latitude is ' + latitude + ' Longitude is ' + longitude);
	app.mapControl.positionReceived(latitude, longitude);
};

app.browserServiceControl.onLocationError = function() {
	console.log('Unable to retrieve the location on client-side - trying the server now...');

	$.get('/fetchPosition', function(latlng) {
		console.log('Server-side position received: ' + latlng);
		app.mapControl.positionReceived(latlng[0], latlng[1]);
	});
};

app.webworkerServiceControl.onError = function(e) {
	console.log("Error line " + e.lineno + " in " + e.filename + ", line #" + e.lineno + " Message: " + e.message);
};

app.webworkerServiceControl.onMsg = function(e) {
	app.sightsControl.markSightsInMap(e.data);
};

$(app.init);