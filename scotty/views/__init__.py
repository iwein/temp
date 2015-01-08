import json

from pyramid.httpexceptions import HTTPNotFound, HTTPRedirection, HTTPFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPError
from pyramid.response import Response
from scotty.views.common import POST
from sqlalchemy.exc import DBAPIError


def db_error(exc, request):
    return Response(json.dumps({'db_message': exc.message}), status_code=400,
                    headers=[('Content-Type', 'application/json')])


def all_error(exc, request):
    return Response(json.dumps({'db_message': exc.message}), status_code=400,
                    headers=[('Content-Type', 'application/json')])


def http_error(exc, request):
    if isinstance(exc, HTTPRedirection):
        return exc
    return Response(json.dumps({'db_message': exc.detail}), status_code=exc.code,
                    headers=[('Content-Type', 'application/json')])


class RootController(object):
    def __init__(self, context, request):
        self.context = context
        self.request = request


@view_config(route_name='home', renderer='scotty:views/templates/index.html')
def home(request):
    return {}


@view_config(route_name='refer', permission=NO_PERMISSION_REQUIRED, request_method="POST")
def recommend(request):
    sndr_email = request.params.get('sndr_email')
    sndr_name = request.params.get('sndr_name')
    rcvr_email = request.params.get('rcvr_email')
    rcvr_name = request.params.get('rcvr_name')
    if not (sndr_name and sndr_email and rcvr_name and rcvr_email) or sndr_email == rcvr_email:
        HTTPFound(location=request.referer or '/')
    else:
        request.emailer.send_friend_referral(sndr_email, sndr_name, rcvr_email, rcvr_name)
    raise HTTPFound(location=(request.referer or '/') + '#referred')



def notfound(exc, request):
    return HTTPNotFound(exc.message)


def includeme(config):
    config.add_route('home', '/')
    config.add_route('refer', '/api/v1/refer')

    config.include("scotty.views.debug", route_prefix='/debug')
    config.add_notfound_view(notfound, append_slash=True)
    config.add_forbidden_view(http_error)

    config.include("scotty.login.views", route_prefix='/api/v1')
    config.include("scotty.configuration.views", route_prefix='/api/v1/config')
    config.include("scotty.candidate.views", route_prefix='/api/v1/candidates')
    config.include("scotty.employer.views", route_prefix='/api/v1/employers')
    config.include("scotty.admin.views", route_prefix='/api/v1/admin')
    config.include("scotty.connect.linkedin", route_prefix='/api/v1/connect')
    config.include("scotty.cms.views", route_prefix='/api/v1/cms')

    config.add_view(context=DBAPIError, view=db_error, permission=NO_PERMISSION_REQUIRED)
    config.add_view(context=Exception, view=all_error, permission=NO_PERMISSION_REQUIRED)
    config.add_view(context=HTTPError, view=http_error, permission=NO_PERMISSION_REQUIRED)
