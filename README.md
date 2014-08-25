winascotty
==========



Deployment to Demo Environment
-----------------------------------


	git push heroku master
	heroku run scotty/scripts/initializedb.py configs/production.ini



Setup local development environment on windows:
-------------------------------------------------


__install psycopg2__
See:
http://stackoverflow.com/questions/3030984/installing-psycopg2-postgresql-in-virtualenv-on-windows