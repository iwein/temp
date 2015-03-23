create role udq3er7kju5h5q WITH LOGIN PASSWORD 'p2crgvt7nmf26p489ta16gbblr2' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE scotty_dev TO udq3er7kju5h5q;
GRANT ALL ON DATABASE scotty_dev TO udq3er7kju5h5q;

drop schema public cascade;
create schema public;
GRANT ALL ON schema public TO udq3er7kju5h5q;
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;


create role ucl17suj4u4hjn WITH LOGIN PASSWORD 'p1pt70eng7mr4e1eq6h5e7s3k94' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE scotty_demo TO ucl17suj4u4hjn;
GRANT ALL ON DATABASE scotty_demo TO ucl17suj4u4hjn;
GRANT CONNECT ON DATABASE scotty_demo TO udq3er7kju5h5q;
GRANT ALL ON DATABASE scotty_demo TO udq3er7kju5h5q;

drop schema public cascade;
create schema public;
GRANT ALL ON schema public TO udq3er7kju5h5q;
GRANT ALL ON schema public TO ucl17suj4u4hjn;
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;



create role udq3er7kju5h5q WITH LOGIN PASSWORD 'p9hsf7ep93f8plf23kjnggk42kd' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE scotty_prod TO udq3er7kju5h5q;
GRANT ALL ON DATABASE scotty_prod TO udq3er7kju5h5q;

drop schema public cascade;
create schema public;
GRANT ALL ON schema public TO udq3er7kju5h5q;
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;