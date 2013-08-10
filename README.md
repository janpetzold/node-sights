node-sights
===========

node.js demo application for nearby sights

After checkout, please run npm install to get all dependencies. Afterwards, load the files geoip-city.dat and geoip-city-names.dat from https://github.com/bluesmoon/node-geoip/tree/master/data and place them in the node_modules/geoip-lite/data folder.

To get city names and population, you need to setup mongodb and download the dataset from /db/cities_pop_location.json. To do so, call the following command inside your mongo installation directory:

mongoimport --host localhost --db geo --type json --drop --collection cities < cities_pop_location.json

To set this app up on Heroku, first download the Heroku toolbelt for your OS.

OpenShift Mongo credentials:

Root User: admin
Root Password: AHQSNFkiMs_a
Database Name: node

Connection URL: mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/


Install RHC (OpenShift command-line tools): https://www.openshift.com/developers/rhc-client-tools-install