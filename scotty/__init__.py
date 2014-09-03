from datetime import datetime, date
import os
from uuid import UUID
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.config import Configurator
from pyramid.renderers import JSON
from pyramid_beaker import session_factory_from_settings
import pyramid_mako
from scotty.auth.provider import AuthProvider, RootResource
from scotty.models.tools import json_encoder
from scotty.predicates import ContentTypePredicate
from sqlalchemy import engine_from_config

import logging

log = logging.getLogger(__name__)


from scotty.models.meta import (DBSession, Base)


def format_date(val, request):
    return val.strftime('%Y-%m-%d')


def format_datetime(val, request):
    return val.strftime('%Y-%m-%dT%H:%M:%S')


def format_uuid(val, request):
    return str(val)


jsonRenderer = JSON()
jsonRenderer.add_adapter(datetime, format_datetime)
jsonRenderer.add_adapter(date, format_date)
jsonRenderer.add_adapter(UUID, format_uuid)
jsonRenderer.add_adapter(Base, json_encoder)


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """

    # respect Heroku Environment VAR
    url = settings['sqlalchemy.url']
    if url.startswith('__env__'):
        name, value = url.split(':', 1)
        settings['sqlalchemy.url'] = os.environ[value.strip()]

    engine = engine_from_config(settings, 'sqlalchemy.')
    log.info("DB Connected at: %s" % settings['sqlalchemy.url'])
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine

    config = Configurator(settings=settings,
                          authentication_policy=AuthProvider(settings),
                          authorization_policy=ACLAuthorizationPolicy(),
                          session_factory=session_factory_from_settings(settings),
                          root_factory=RootResource)

    config.add_directive('add_mako_renderer', pyramid_mako.add_mako_renderer)
    config.add_mako_renderer(".html")

    config.add_renderer('json', jsonRenderer)
    config.add_renderer(None, jsonRenderer)
    config.add_view_predicate('content_type', ContentTypePredicate)

    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include('scotty.views')

    return config.make_wsgi_app()
