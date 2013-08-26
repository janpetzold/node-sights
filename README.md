node-sights
===========

node.js demo application for nearby sights

See it online: http://app-nodesights.rhcloud.com

After checkout, please run npm install to get all dependencies. Afterwards, load the files geoip-city.dat and geoip-city-names.dat from https://github.com/bluesmoon/node-geoip/tree/master/data and place them in the node_modules/geoip-lite/data folder.

To get city names and population, you need to setup mongodb and download the dataset from /db/cities_pop_location.json. To do so, create a database "app" in MongoDB and execute the following command to import the data:

mongoimport --host localhost --db app --type json --drop --collection cities < cities_pop_location.json

You can easily publish this app on any cloud service. As an example, here are the steps you need to get it running on the OpenShift platform:

1. Install RHC (OpenShift command-line tools): https://www.openshift.com/developers/rhc-client-tools-install. Setup will guide you through authentication and generates an SSH key you'll need for remote administration.
2. Create the app, we'll call it "app": rhc create-app nodesights nodejs-0.6
3. Add a MongoDB "cartridge": rhc cartridge-add mongodb-2.2 --app app. Notice the username and password on the output - you'll need it later on.

Publishing is a bit more complicated - we could easily publish by the OpenShift Git repo but we already have it on GitHub. Therefore, we first pull the OpenSShift repo, fix all differences and push it later on. To do that, log into the OpenShift web console and note the path to the Git repo. It will be something like ssh://123456@app-nodesights.rhcloud.com/~/git/app.git/. So here we go:

1. Add the OpenShift repo as another origin with the name "openshift": git remote add openshift -f ssh://5213c95fe0b8cd8c3a000191@app-nodesights.rhcloud.com/~/git/app.git/
2. Change into your base directory and pull the data from the OpenShift repo: git pull openshift HEAD
3. Merge all changes - it won't be much.
4. Push the result to OpenShift: git push openshift master

You can follow the installation and startup of the app in the console after that. Following pushes will just upload all changes and not the whole application.

You usual GitHub workflow (git pull / git push origin master) won't be affected. So to update your live deployment all you need to do is to issue another git push!

The application should work now, but we still need perform some steps:

1. Make sure you know how to SSH into your app (details here: https://www.openshift.com/developers/remote-access)
2. After login, change to the main directory via cd $OPENSHIFT_REPO_DIR. Execute the env command to see your host and username/password.
3. Import the data just as you did before with the following command:

mongoimport --host YOURHOST -u admin -p YOURPASSWORD --db app --type json --drop --collection cities < db/cities_pop_location.json

4. After that, enter the following commands to create a 2D index for the fast retrieval of geo data:
mongo
use app
db.cities.ensureIndex({Location : "2d" })
exit

5. The last step is to copy the city dataset into the node_modules directory for the Geo-IP module. To do so, execute the following command:

cp db/*.dat node_modules/geoip-lite/data/

6. Leave SSH and restart the app with the following command: rhc app restart -a app

That's it. Could be easier, but doable and will keep you flexible.