from __future__ import with_statement
import os
from alembic import context
from sqlalchemy import engine_from_config, pool
from logging.config import fileConfig

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
from scotty.models import *

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    # respect Heroku Environment VAR
    settings = config.get_section(config.config_ini_section)
    subsettings = config.get_section('app:api')
    url = subsettings['sqlalchemy.url']
    if url.startswith('__env__'):
        name, value = url.split(':', 1)
        subsettings['sqlalchemy.url'] = os.environ[value.strip()]

    engine = engine_from_config(subsettings, prefix='sqlalchemy.', poolclass=pool.NullPool)

    def include_object(object, name, type_, reflected, compare_to):
        IGNORE_TABLES = ['spatial_ref_sys', 'unified_login']
        return not (type_ == "table" and (
            object.name.startswith('v_') or object.name.startswith('stats_') or object.name in IGNORE_TABLES) )

    connection = engine.connect()
    context.configure(connection=connection, target_metadata=target_metadata, include_object=include_object)

    try:
        with context.begin_transaction():
            context.run_migrations()
    finally:
        connection.close()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

