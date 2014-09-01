winascotty
==========



###Deployment to Demo Environment
Demo Environment is at [http://guarded-inlet-9319.herokuapp.com/debug](http://guarded-inlet-9319.herokuapp.com/debug)


	git push heroku master
	heroku run scotty/scripts/initializedb.py configs/production.ini



### Setup local development environment:

* install postgres (9.3 recommended)
* install python 2.7, setuptools, virtualenv
* create a virtual environment for this project, activate it
* run <code>python setup.py develop</code> for this project
* copy a local.ini config file with proper Postgres Connection Strings, <code>sqlalchemy.url</code>
  * note this is mentioned twice in the config file
* run <code>alembic -c [CONFIG] upgrade head</code>
* start the server with <code>paste serve --reload configs/[CONFIG]</code> 
* open a browser on [http://localhost:8080](http://localhost:8080)

### Pulling Code and Upgrading API

After each pull it is advised you
* run <code>alembic -c [CONFIG] upgrade head</code>
  
All data model changes get set up through this cmd. 
If you see unexpect errors in the API, make sure to run the script.

If this script fails with "Unknown revision .....", you will need to empty out the DB and run the command again.
This will destroy all test data, and thats ok.

Reset the db by running the following in the relevant database:

    drop schema public cascade;
    create schema public;
 

#####Install psycopg2 on windows

See:
http://stackoverflow.com/questions/3030984/installing-psycopg2-postgresql-in-virtualenv-on-windows

### Setup frontend environment
* Enter into `/scotty/static`
* Execute `bower install`

The main file is at `/scotty/static/public/index.html`

No build process required for development.
For production dependencies should be installed with `npm install`.
Build process is executed with `grunt build`
