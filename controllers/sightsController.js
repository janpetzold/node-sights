/**
 * Controller that is called once the sights data shall be fetched by
 * the server. 
 */

var sights = require('../cross_modules/sights');

exports.getSights = function(req, res){
  var boundingBox = req.body.boundingBox;
  console.log("Fetching the sights from server - bounding box is " + boundingBox);

  // build the service-URL based on the boundingBox
  var serviceUrl = sights.constructUrl(boundingBox);

  sights.fetchData(serviceUrl, function(xhr) {
	var result = sights.processResult(xhr.responseText);
	res.send(result);
  });
};