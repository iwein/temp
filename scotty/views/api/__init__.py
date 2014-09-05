import json
from pyramid.httpexceptions import HTTPException, HTTPError
from pyramid.response import Response
from scotty.views.api import configuration, candidate, employer
from sqlalchemy.exc import IntegrityError, DBAPIError


def db_error(exc, request):
    return Response(json.dumps({'db_message': exc.message}), status_code=400,
                    headers=[('Content-Type', 'application/json')])


def all_error(exc, request):
    return Response(json.dumps({'db_message': exc.message}), status_code=400,
                    headers=[('Content-Type', 'application/json')])


def http_error(exc, request):
    return Response(json.dumps({'db_message': exc.detail}), status_code=exc.code,
                    headers=[('Content-Type', 'application/json')])


def includeme(config):
    config.include(configuration, route_prefix='/config')
    config.include(candidate, route_prefix='/candidates')
    config.include(employer, route_prefix='/employers')

    config.add_view(context=DBAPIError, view=db_error)
    #config.add_view(context=Exception, view=all_error)
    config.add_view(context=HTTPError, view=http_error)