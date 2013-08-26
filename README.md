node-sights
===========

node.js demo application for nearby sights

See it online: http://app-nodesights.rhcloud.com

After checkout, please run npm install to get all dependencies. Afterwards, load the files geoip-city.dat and geoip-city-names.dat from https://github.com/bluesmoon/node-geoip/tree/master/data and place them in the node_modules/geoip-lite/data folder.

To get city names and population, you need to setup mongodb and download the dataset from /db/cities_pop_location.json. To do so, call the following command inside your mongo installation directory:

mongoimport --host localhost --db nodesights --type json --drop --collection cities < cities_pop_location.json

You can easily publish this app on any cloud service. As an example, here are the steps you need to get it running on the OpenShift platform:

1. Install RHC (OpenShift command-line tools): https://www.openshift.com/developers/rhc-client-tools-install. Setup will guide you through authentication and generates an SSH key you'll need for remote administration.
2. Create the app, we'll call it "app": rhc create-app nodesights nodejs-0.6
3. Add a MongoDB "cartridge": rhc cartridge-add mongodb-2.2 --app app. Notice the username and password on the output - you'll need it later on.

Publishing is a bit more complicated - we could easily publish by the OpenShift Git repo but we already have it on GitHub. Therefore, we first pull the OpenSShift repo, fix all differences and push it later on. To do that, log into the OpenShift web console and note the path to the Git repo. It will be something like ssh://123456@app-nodesights.rhcloud.com/~/git/app.git/. So here we go:

1. Change into your base directory and pull the data from the OpenShift repo: git pull ssh://123456@app-nodesights.rhcloud.com/~/git/app.git/
2. Merge all changes - it won't be much.
3. Push the result to OpenShift: git push ssh://12345@app-nodesights.rhcloud.com/~/git/app.git/ master

You can follow the installation in the console after that.

You usual GitHub workflow (git pull / git push origin master) won't be affected.



To publish nthe



You do the same on a cloud provider like OpenShift, just modify the parameters accordingly:
mongoimport --host XXX -u admin -p YYY --db nodesights --type json --drop --collection cities < ~/app-root/repo/db/cities_pop_location.json

You need to make sure that there is a 2D index on the column for latitude/longitude. To set this one, connect to mongo and call these commands:

use nodesights
db.cities.ensureIndex({Location : "2d" })

This will ensure that queries with the geo coordinates as parameter will deliver the city name and population very fast.

To start/stop mongodb:
rhc cartridge start mongodb-2.2 -a nodesights

Deploy the app:
rhc app create nodesights nodejs --from-code=http://github.com/janpetzold/node-sights.git

Remove the app:
rhc app delete nodesights







Install rhc firs

Connection URL: mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/


Install RHC (OpenShift command-line tools): https://www.openshift.com/developers/rhc-client-tools-install

Setup will guide you through authentication and generates an SSH key.

rhc create-app nodesights nodejs-0.6 --from-code=https://github.com/janpetzold/node-sights.git

See some details:
rhc show-app nodesights
Restart the app:
rhc app restart -a nodesights

Afterwards, connect via SSH.

To find out host and port of mongo, run this command on the shell:

env





Also helpful after SSH login:
cd $OPENSHIFT_REPO_DIR
