import json
from datetime import timedelta, datetime

from pyramid.httpexceptions import HTTPNotFound, HTTPRedirection, HTTPFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPError
from pyramid.response import Response
from scotty import DBSession
from scotty.models import Referral
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


@view_config(route_name='refer', permission=NO_PERMISSION_REQUIRED, **POST)
def recommend(request):
    lang = request.json.get('lang', 'en')
    sndr_email = request.json.get('sndr_email')
    sndr_name = request.json.get('sndr_name')
    rcvr_email = request.json.get('rcvr_email')
    rcvr_name = request.json.get('rcvr_name')
    message = request.json.get('message')
    if not (sndr_name and sndr_email and rcvr_name and rcvr_email and message):
        return {'success': False, 'message': 'Missing Info'}
    else:
        sndr_email = sndr_email.lower()
        rcvr_email = rcvr_email.lower()

        spam_cutoff = datetime.now() - timedelta(1)

        def send_email():
            request.emailer.send_friend_referral(lang, sndr_email, sndr_name, rcvr_email, rcvr_name, message)

        referral = DBSession.query(Referral).filter(Referral.rcvr_email == rcvr_email,
                                                    Referral.sndr_email == sndr_email).first()

        if referral:
            if referral.last_sent > spam_cutoff:
                return {'success': False, 'message': 'not-referred-too-early'}
            referral.last_sent = datetime.now()
            referral.sent_count += 1
            send_email()
        else:
            spam_count = DBSession.query(Referral).filter(Referral.last_sent > spam_cutoff,
                                                          Referral.sndr_email == sndr_email).count()
            if spam_count > 25:
                return {'success': False, 'message': 'not-referred-too-many'}
            send_email()
            referral = Referral(sndr_email=sndr_email, sndr_name=sndr_name,
                                rcvr_email=rcvr_email, rcvr_name=rcvr_name)
            DBSession.add(referral)
    return {'success': True, 'message': 'referred'}


@view_config(route_name='contact', permission=NO_PERMISSION_REQUIRED, request_method="POST")
def contact(request):
    email = request.params.get('email')
    name = request.params.get('name')
    message = request.params.get('message')
    if not (name and email and message):
        HTTPFound(location=request.referer or '/')
    else:
        request.emailer.send_contact_request(email, name, message)
    raise HTTPFound(location=(request.referer or '/') + '#contacted')


def notfound(exc, request):
    return HTTPNotFound(exc.message)


def includeme(config):
    config.add_route('home', '/')
    config.add_route('refer', '/api/v1/refer')
    config.add_route('contact', '/api/v1/contact')

    config.include("scotty.views.debug", route_prefix='/debug')
    config.add_notfound_view(notfound, append_slash=True)
    # config.add_forbidden_view(http_error)

    config.include("scotty.login.views", route_prefix='/api/v1')
    config.include("scotty.configuration.views", route_prefix='/api/v1/config')
    config.include("scotty.candidate.views", route_prefix='/api/v1/candidates')
    config.include("scotty.employer.views", route_prefix='/api/v1/employers')
    config.include("scotty.admin.views", route_prefix='/api/v1/admin')
    config.include("scotty.connect.linkedin", route_prefix='/api/v1/connect')
    config.include("scotty.connect.xing", route_prefix='/api/v1/connect')
    config.include("scotty.cms.views", route_prefix='/api/v1/cms')

    config.add_view(context=DBAPIError, view=db_error, permission=NO_PERMISSION_REQUIRED)
    config.add_view(context=Exception, view=all_error, permission=NO_PERMISSION_REQUIRED)
    config.add_view(context=HTTPError, view=http_error, permission=NO_PERMISSION_REQUIRED)
