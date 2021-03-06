winascotty
==========

### Available Environment

DEV/CI Environment (continuously deployed):

* Available @ [http://dev.scotty.frf.me/](http://dev.scotty.frf.me/)

Demo Environment (updated weekly)

* Frontend/API: [http://demo.scotty.frf.me/](http://demo.scotty.frf.me/)

### Optimizely

email: scotty@hackandcraft.com
Password: Helloworld123


### Setup local development environment:

* install postgres (9.3 recommended)
* install python 2.7, setuptools, virtualenv
* create a virtual environment for this project, activate it
* run <code>python setup.py develop</code> for this project
* copy a local.ini config file with proper Postgres Connection Strings, <code>sqlalchemy.url</code>
  * note this is mentioned twice in the config file
* run <code>alembic -c [CONFIG] upgrade head</code>
* start the server with <code>paster serve --reload configs/[CONFIG]</code>
* open a browser on [http://localhost:8080](http://localhost:8080)

### Pulling Code and Upgrading API

After each pull it is advised you
* run <code>alembic -c [CONFIG] upgrade head</code>

All data model changes get set up through this cmd.
If you see unexpect errors in the API, make sure to run the script.

If this script fails with "Unknown revision .....", you will need to empty out the DB and run the command again.
This will destroy all test data, and thats ok.

Reset the db by running the following in postgres on the relevant database:

    drop schema public cascade;
    create schema public;

and then

* run <code>alembic -c [CONFIG] upgrade head</code>

####Installing postgres

To install postgres python drivers, youll need postgres headers installed.
If you are setting up a new DB make sure to install the POSTGIS extension.
You can just run

     CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
     CREATE EXTENSION IF NOT EXISTS postgis;
     CREATE EXTENSION IF NOT EXISTS pg_stat_statements;


#####Install psycopg2 on windows

See:
http://stackoverflow.com/questions/3030984/installing-psycopg2-postgresql-in-virtualenv-on-windows

### Setup frontend environment
* Enter into `/scotty/static`
* Execute `bower install`

The main file is at `/scotty/static/public/index.html`

#### Static pages

Static pages are located at `/apps/index/pages`, each one uses `/apps/index/template.html`.
Static pages need to be built for development & production.

- For production `grunt build` or `grunt build-index` will output it to `/dist` folder.
- For development `grunt dev:static-pages` or simply `grunt dev` will output it to `/apps` folder.
- While editing the pages `grunt listen` will execute `grunt dev` every time a static page template is modified.

#### Build

No build process required for development.
For production dependencies should be installed with `npm install`.
Build process is executed with `grunt build`

#### Unbuild

To return to development mode after build two commands are required:

* `grunt clean`
* `git checkout public`

If you know a simpler way to do this please let me know.

#### Tests

To run the test `npm install` is required. Grunt tasks are:

* `grunt test:unit`: To run unit tests
* `grunt test:e2e`: To execute end to end tests
* `grunt test`: All tests with linting

#### Web Interface Tests
These are built with selenium and are stored in a separate repo [here](https://github.com/HarryMcCarney/ScottySeleniumTests)

