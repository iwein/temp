winascotty
==========



###Deployment to Demo Environment



	git push heroku master
	heroku run scotty/scripts/initializedb.py configs/production.ini



###Setup local development environment:

* install postgres (9.3 recommended)
* install python 2.7, setuptools, virtualenv
* create a virtual environment for this project, activate it
* run <code>easy_install setup.py develop</code> for this project
* copy a local.ini config file with proper Postgres Connection Strings, <code>sqlalchemy.url</code>
  * note this is mentioned twice in the config file
* run <code>alembic -c [CONFIG] upgrade head</code>
* start the server with <code>paste serve --reload configs/[CONFIG]</code> 
* open a browser on [http://localhost:8080](http://localhost:8080)


####Install psycopg2
See:
http://stackoverflow.com/questions/3030984/installing-psycopg2-postgresql-in-virtualenv-on-windows
