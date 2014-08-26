from datetime import datetime, date
from pyramid.config import Configurator
from pyramid.renderers import JSON
from scotty.models import json_encoder
from sqlalchemy import engine_from_config

import logging

log = logging.getLogger(__name__)


from scotty.models.meta import (DBSession, Base)


def format_date(val, request):
    return val.strftime('%Y-%m-%d')


def format_datetime(val, request):
    return val.strftime('%Y-%m-%dT%H:%M:%S')


jsonRenderer = JSON()
jsonRenderer.add_adapter(datetime, format_datetime)
jsonRenderer.add_adapter(date, format_date)
jsonRenderer.add_adapter(Base, json_encoder)


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    engine = engine_from_config(settings, 'sqlalchemy.')
    log.info("DB Connected at: %s" % settings['sqlalchemy.url'])

    DBSession.configure(bind=engine)
    Base.metadata.bind = engine
    config = Configurator(settings=settings)
    config.include('pyramid_chameleon')
    config.add_renderer('json', jsonRenderer)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include('scotty.views')
    return config.make_wsgi_app()
