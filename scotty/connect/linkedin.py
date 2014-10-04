import json
import logging
import urllib

from pyramid.httpexceptions import HTTPFound, HTTPForbidden
from pyramid.response import Response
from pyramid.view import view_config
import requests
from scotty.connect.common import SocialLoginSuccessful, SocialNetworkException, assemble_profile_procs


log = logging.getLogger(__name__)
SETTINGS = {'network': 'linkedin', 'default_picture': "//www.gravatar.com/avatar/00000000000000000000000000000000?d=mm"}


def includeme(config):
    config.add_route("api_connect_linkedin", pattern="linkedin", factory=SocialResource)
    config.add_view(redirect_view, route_name="api_connect_linkedin")

    config.add_route("api_connect_linkedin_cb", pattern="linkedin/cb", factory=SocialResource)
    config.add_view(callback_view, route_name="api_connect_linkedin_cb")

    config.add_route("api_connect_linkedin_me", pattern="linkedin/me", factory=SocialResource)
    config.add_view(view_my_profile, route_name="api_connect_linkedin_me")

    config.add_route("api_connect_linkedin_me_forget", pattern="linkedin/me/forget", factory=SocialResource)
    config.add_view(forget_my_profile, route_name="api_connect_linkedin_me_forget")

    config.add_route("api_connect_linkedin_wxp", pattern="linkedin/work_experience", factory=SocialResource)
    config.add_view(view_my_positions, route_name="api_connect_linkedin_wxp")

    config.add_route("api_connect_linkedin_edu", pattern="linkedin/education", factory=SocialResource)
    config.add_view(view_my_education, route_name="api_connect_linkedin_edu")

    settings = config.registry.settings

    SETTINGS.update({'apikey': settings['linkedin.apikey'], 'apisecret': settings['linkedin.apisecret']})


@view_config(context=SocialNetworkException)
def soc_error(exc, request):
    return Response(json.dumps({'db_message': exc.detail}), status_code=403,
                    headers=[('Content-Type', 'application/json')])


class SocialResource(object):
    def __init__(self, request):
        self.request = request

    getCodeEndpoint = "https://www.linkedin.com/uas/oauth2/authorization"
    getTokenEndpoint = "https://www.linkedin.com/uas/oauth2/accessToken"
    profileEndpoint = "https://api.linkedin.com/v1/people/~:(id,first-name,last-name,picture-url,email-address)"
    positionsEndpoint = "https://api.linkedin.com/v1/people/~/positions"
    educationEndpoint = "https://api.linkedin.com/v1/people/~/educations"

    def start_process(self, request):
        furl = request.params.get('furl')
        if furl:
            request.session.flash(furl, 'redirections')


def redirect_view(context, request):
    context.start_process(request)
    params = {'response_type': "code", 'client_id': SETTINGS['apikey'], 'state': request.session.get_csrf_token(),
              'scope': 'r_basicprofile r_emailaddress r_network r_fullprofile r_contactinfo w_messages',
              'redirect_uri': request.route_url('api_connect_linkedin_cb')}
    raise HTTPFound(location="{}?{}".format(context.getCodeEndpoint, urllib.urlencode(params)))


def token_func(context, request):
    code = request.params.get("code")
    state = request.params.get("state")
    if not code or state != request.session.get_csrf_token():
        raise SocialNetworkException("Linkedin Login Failed")

    params = {'grant_type': 'authorization_code', 'code': code, 'redirect_uri': request.route_url('api_connect_linkedin_cb'),
              'client_id': SETTINGS['apikey'], 'client_secret': SETTINGS['apisecret']}

    return requests.post(context.getTokenEndpoint, params=params, data={})


def profile_func(token_json, context, request):
    access_token = token_json['access_token']
    return access_token, requests.get(context.profileEndpoint, params={'oauth2_access_token': access_token},
                                      headers={'x-li-format': 'json'})


def parse_profile_func(token, profile, context, request):
    return dict(network=SETTINGS['network'], id=profile['id'], accessToken=token,
                picture=profile.get('pictureUrl', SETTINGS['default_picture']), email=profile['emailAddress'], name=u"{firstName} {lastName}".format(**profile))


get_profile = assemble_profile_procs(SETTINGS, token_func, profile_func, parse_profile_func)


def callback_view(context, request):
    profile = get_profile(context, request)
    result = SocialLoginSuccessful(profile)
    request.session['linkedin'] = profile
    raise HTTPFound(location=result.get_redirection(request))


def view_my_profile(ctxt, request):
    if 'accessToken' not in request.session.get('linkedin', {}):
        raise HTTPForbidden("Not Connected Yet")
    else:
        return request.session['linkedin']


def forget_my_profile(ctxt, request):
    if 'linkedin' in request.session:
        del request.session['linkedin']
    return {'success': True}


def view_my_positions(context, request):
    if 'accessToken' not in request.session.get('linkedin', {}):
        raise HTTPForbidden("Not Connected Yet")
    else:
        profile = request.session['linkedin']
        access_token = profile['accessToken']
        results = requests.get(context.positionsEndpoint, params={'oauth2_access_token': access_token},
                               headers={'x-li-format': 'json'})
        exp = results.json()
        if results.status_code != 200:
            raise HTTPForbidden("Some Error from Linkedin, %s:%s" %(results.status_code, results.text))
        elif exp.get('_total', 0) <= 0:
            return []
        else:
            experiences = []
            for p in exp.get('values', []):

                p['startDate'].setdefault('day', 1)
                p['startDate'].setdefault('month', 1)
                if p.get('endDate'):
                    p['endDate'].setdefault('day', 1)
                    p['endDate'].setdefault('month', 1)

                experiences.append({
                    'start':  '%(year)04d-%(month)02d-%(day)02d' % p['startDate'],
                    'end': '%(year)04d-%(month)02d-%(day)02d' % p['endDate'] if p.get('endDate') else None,
                    'role': p.get('title'),
                    'company': p.get('company', {}).get('name'),
                    'summary': p.get('summary')})
            return experiences

def view_my_education(context, request):
    if 'accessToken' not in request.session.get('linkedin', {}):
        raise HTTPForbidden("Not Connected Yet")
    else:
        profile = request.session['linkedin']
        access_token = profile['accessToken']
        results = requests.get(context.educationEndpoint, params={'oauth2_access_token': access_token},
                               headers={'x-li-format': 'json'})
        exp = results.json()
        if results.status_code != 200:
            raise HTTPForbidden("Some Error from Linkedin, %s:%s" % (results.status_code, results.text))
        elif exp.get('_total', 0) <= 0:
            return []
        else:
            education = []
            for p in exp.get('values', []):
                education.append({
                    'institution': p.get('schoolName'),
                    'degree': p.get('degree'),
                    'course': p.get('fieldOfStudy'),
                    'start': p.get('startDate', {}).get('year'),
                    'end': p.get('endDate', {}).get('year')})
            return education