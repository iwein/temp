import json
from datetime import timedelta, datetime
import colander
from pyramid.events import subscriber, BeforeRender

from pyramid.httpexceptions import HTTPNotFound, HTTPRedirection, HTTPFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPError
from pyramid.response import Response
from scotty.candidate.models import Candidate
from scotty.employer.models import Employer
from scotty.models.meta import DBSession
from scotty.models import Referral
from scotty.views.common import POST
from sqlalchemy import update
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


def schema_error(exc, request):
    def as_dict(paths):
        errors = {}
        for path in paths:
            keyparts = []
            msgs = []
            for exc in path:
                exc.msg and msgs.extend(exc.messages())
                keyname = exc._keyname()
                keyname and keyparts.append(keyname)
            errors['.'.join(keyparts)] = '; '.join(colander.interpolate(msgs))
        return errors

    body = {"message": getattr(exc, 'message') or 'BAD REQUEST', 'errors': as_dict(exc.paths())}
    return Response(json.dumps(body), status_code=getattr(exc, 'code', 400),
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
        return HTTPFound(location=request.referer or '/')
    else:
        request.emailer.send_contact_request(email, name, message)
    return HTTPFound(location=(request.referer or '/') + '#contacted')


def notfound(exc, request):
    return HTTPNotFound(exc.message)


@subscriber(BeforeRender)
def add_last_activity_updater(event):
    """
    Update last activity, i.e. endpoint called
    """
    request = event['request']
    if request and request.log_activity:
        if request.candidate_id:
            c = DBSession.query(Candidate).get(request.candidate_id)
            if c:
                c.last_active = datetime.now()
                DBSession.flush()
        if request.employer_id:
            e = DBSession.query(Employer).get(request.employer_id)
            if e:
                e.last_active = datetime.now()
                DBSession.flush()


def includeme(config):
    config.add_route('home', '/')
    config.add_route('refer', '/api/v1/refer')
    config.add_route('contact', '/api/v1/contact')

    config.include("scotty.views.debug", route_prefix='/debug')
    config.include("scotty.views.api_preview")
    config.add_notfound_view(notfound, append_slash=True)

    config.include("scotty.login.views", route_prefix='/api/v1')
    config.include("scotty.configuration.views", route_prefix='/api/v1/config')
    config.include("scotty.candidate.views", route_prefix='/api/v1/candidates')
    config.include("scotty.employer.views", route_prefix='/api/v1/employers')
    config.include("scotty.admin.views", route_prefix='/api/v1/admin')
    config.include("scotty.connect.linkedin", route_prefix='/api/v1/connect')
    config.include("scotty.connect.xing", route_prefix='/api/v1/connect')
    config.include("scotty.cms.views", route_prefix='/api/v1/cms')

    settings = config.get_settings()
    if not settings.get('pyramid.reload_templates'):
        config.add_view(context=DBAPIError, view=db_error, permission=NO_PERMISSION_REQUIRED)
        config.add_view(context=Exception, view=all_error, permission=NO_PERMISSION_REQUIRED)
        config.add_view(context=HTTPError, view=http_error, permission=NO_PERMISSION_REQUIRED)
    config.add_view(context=colander.Invalid, view=schema_error, permission=NO_PERMISSION_REQUIRED)
