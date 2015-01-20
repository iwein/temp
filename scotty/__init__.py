from datetime import datetime, date
from uuid import UUID
import logging

import os
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.config import Configurator
from pyramid.renderers import JSON
from pyramid_beaker import session_factory_from_settings
import pyramid_mako
from scotty.tools import resolve_env_value
from sqlalchemy.ext.associationproxy import _AssociationList
from sqlalchemy.util import KeyedTuple
from scotty.auth.provider import AuthProvider, RootResource, get_candidate_id, get_employer_id
from scotty.models.tools import json_encoder, association_proxy, keyed_tuple_slsr
from scotty.predicates import ContentTypePredicate
from scotty.services.emailer import emailer_factory
from sqlalchemy import engine_from_config


log = logging.getLogger(__name__)


from scotty.models.meta import (DBSession, Base)


def format_date(val, request):
    return val.isoformat().split("T")[0]


def format_datetime(val, request):
    return val.isoformat()


def format_uuid(val, request):
    return str(val)


jsonRenderer = JSON()
jsonRenderer.add_adapter(datetime, format_datetime)
jsonRenderer.add_adapter(date, format_date)
jsonRenderer.add_adapter(UUID, format_uuid)
jsonRenderer.add_adapter(KeyedTuple, keyed_tuple_slsr)
jsonRenderer.add_adapter(Base, json_encoder)
jsonRenderer.add_adapter(_AssociationList, association_proxy)


class CORS(object):
    "WSGI middleware allowing CORS requests to succeed"
    origin = '*'
    methods = 'GET, POST, PUT, DELETE, OPTIONS'
    headers = 'accept, origin, content-type, x-requested-with, x-requested-by'

    def __init__(self, application, cfg=None, **kw):
        self.app = application

    def __call__(self, environ, start_response):
        if 'OPTIONS' == environ['REQUEST_METHOD']:
            headers = []
            self.attach_headers(environ, headers)
            status = '204 OK'
            start_response(status, headers)
            return ''

        def attach_cors_headers(status, headers, exc_info=None):
            self.attach_headers(environ, headers)
            return start_response(status, headers, exc_info)

        return self.app(environ, attach_cors_headers)

    def attach_headers(self, environ, headers):
        origin = environ.get('HTTP_ORIGIN', self.origin)
        headers.append(('Access-Control-Allow-Origin', origin))
        headers.append(('Access-Control-Allow-Methods', self.methods))
        headers.append(('Access-Control-Allow-Headers', self.headers))
        headers.append(("Access-Control-Max-Age", "30758400"))
        headers.append(('Access-Control-Allow-Credentials', 'true'))
        return headers


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    # respect Heroku Environment VAR
    resolve_env_value(settings, 'sqlalchemy.url')
    resolve_env_value(settings, 'frontend.domain')
    resolve_env_value(settings, 'mandrill.sender', '')
    resolve_env_value(settings, 'admin.emails')

    engine = engine_from_config(settings, 'sqlalchemy.')
    log.info("DB Connected at: %s" % settings['sqlalchemy.url'])
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine

    config = Configurator(settings=settings,
                          authentication_policy=AuthProvider(settings),
                          authorization_policy=ACLAuthorizationPolicy(),
                          session_factory=session_factory_from_settings(settings),
                          root_factory=RootResource,
                          default_permission='default_permission')

    def get_front_end_domain(request):
        return settings['frontend.domain']

    config.add_request_method(get_front_end_domain, 'frontend_domain', reify=True)

    config.add_directive('add_mako_renderer', pyramid_mako.add_mako_renderer)
    config.add_mako_renderer(".html")

    config.add_renderer('json', jsonRenderer)
    config.add_renderer(None, jsonRenderer)
    config.add_view_predicate('content_type', ContentTypePredicate)

    config.add_request_method(emailer_factory(settings), 'emailer', reify=True)
    config.add_request_method(get_candidate_id, 'candidate_id', property=True)
    config.add_request_method(get_employer_id, 'employer_id', property=True)

    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include('scotty.views')
    config.scan()

    app = config.make_wsgi_app()
    return CORS(app)
