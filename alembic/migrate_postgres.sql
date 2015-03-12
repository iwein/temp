create role udq3er7kju5h5q WITH LOGIN PASSWORD 'p2crgvt7nmf26p489ta16gbblr2' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE scotty_ci TO udq3er7kju5h5q;
GRANT ALL ON DATABASE scotty_ci TO udq3er7kju5h5q;

drop schema public cascade;
create schema public;
GRANT ALL ON schema public TO udq3er7kju5h5q;
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;