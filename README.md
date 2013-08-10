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

Install rhc firs

Connection URL: mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/


Install RHC (OpenShift command-line tools): https://www.openshift.com/developers/rhc-client-tools-install

Setup will guide you through authentication and generates an SSH key.

Afterwards, connect via SSH.

To find out host and port of mongo, run this command:

lsof -iTCP -sTCP:LISTEN | grep mongo

Than you'll know the address and port mongo works with.
To import the data, run this:

mongoimport --host 127.8.52.2 -u admin -p AHQSNFkiMs_a --db geo --type json --drop --collection cities < ~/app-root/repo/db/cities_pop_location.json

You need to make sure that there is a 2D index on the column for latitude/longitude. To set this one, connect to mongo and call these commands:

use geo
db.cities.ensureIndex({loc : "2d" })