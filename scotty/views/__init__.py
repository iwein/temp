from functools import wraps

from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config

import json

from pyramid.httpexceptions import HTTPError
from pyramid.response import Response
from sqlalchemy.exc import DBAPIError


def db_error(exc, request):
    return Response(json.dumps({'db_message': exc.message}), status_code=400,
                    headers=[('Content-Type', 'application/json')])


def all_error(exc, request):
    return Response(json.dumps({'db_message': exc.message}), status_code=400,
                    headers=[('Content-Type', 'application/json')])


def http_error(exc, request):
    return Response(json.dumps({'db_message': exc.detail}), status_code=exc.code,
                    headers=[('Content-Type', 'application/json')])


def pass_request(f):
    @wraps(f)
    def __inner__(self):
        return f(self, self.request)
    return __inner__


class RootController(object):
    def __init__(self, request):
        self.request = request


@view_config(route_name='home', renderer='scotty:views/templates/index.html')
def home(request):
    return {}


def notfound(exc, request):
    return HTTPNotFound(exc.message)


def includeme(config):
    config.add_route('home', '/')

    config.include("scotty.views.debug", route_prefix='/debug')

    config.add_notfound_view(notfound, append_slash=True)

    config.include("scotty.configuration", route_prefix='/api/v1/config')
    config.include("scotty.candidate", route_prefix='/api/v1/candidates')
    config.include("scotty.employer", route_prefix='/api/v1/employers')
    config.include("scotty.admin", route_prefix='/api/v1/admin')
    config.include("scotty.connect.linkedin", route_prefix='/api/v1/connect')


    config.add_view(context=DBAPIError, view=db_error)
    #config.add_view(context=Exception, view=all_error)
    config.add_view(context=HTTPError, view=http_error)
