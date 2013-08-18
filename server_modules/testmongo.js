var mongodb = require('mongodb');

var dbServer = new mongodb.Server(process.env.OPENSHIFT_MONGODB_DB_HOST, parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT, 10));
var db = new mongodb.Db('nodesights', dbServer);
var dbUser = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
var dbPass = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;

console.log("User: " + dbUser + " Password: " + dbPass + " Host: " + process.env.OPENSHIFT_MONGODB_DB_HOST);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to database");
        db.authenticate(dbUser, dbPass, function(err, res) {
            if(!err) {
                console.log("Authenticated");
                console.log(db.collection('openshift').count());
                db.collection('cities').find().toArray(function(err, city) {
                        console.log(city);
                });
            } else {
                console.log("Error in authentication.");
                console.log(err);
            }
        });
    } else {
        console.log("Error in open().");
        console.log(err);
    };
});
