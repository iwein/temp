import json
import logging
from operator import itemgetter
import urllib
from urlparse import parse_qsl

from pyramid.httpexceptions import HTTPFound, HTTPForbidden
from pyramid.security import NO_PERMISSION_REQUIRED
import requests
from scotty.connect.common import SocialLoginSuccessful, SocialNetworkException, assemble_profile_procs, \
    logged_in_with, RootSocialResource
from scotty.connect.profile_translate import translate
from scotty.oauth import Client, Consumer, Token
from scotty.tools import ensure_list


log = logging.getLogger(__name__)
SETTINGS = {'network': 'xing', 'default_picture': "//www.gravatar.com/avatar/00000000000000000000000000000000?d=mm"}


def includeme(config):
    config.add_route("api_connect_xing", pattern="xing", factory=SocialResource)
    config.add_view(redirect_view, route_name="api_connect_xing", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_xing_cb", pattern="xing/cb", factory=SocialResource)
    config.add_view(callback_view, route_name="api_connect_xing_cb", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_xing_me", pattern="xing/me", factory=SocialResource)
    config.add_view(view_me, route_name="api_connect_xing_me", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_xing_me_forget", pattern="xing/me/forget", factory=SocialResource)
    config.add_view(forget_my_profile, route_name="api_connect_xing_me_forget", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_xing_wxp", pattern="xing/work_experience", factory=SocialResource)
    config.add_view(view_my_positions, route_name="api_connect_xing_wxp", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_xing_edu", pattern="xing/education", factory=SocialResource)
    config.add_view(view_my_education, route_name="api_connect_xing_edu", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_xing_profile", pattern="xing/profile", factory=SocialResource)
    config.add_view(view_my_profile, route_name="api_connect_xing_profile", permission=NO_PERMISSION_REQUIRED)

    settings = config.registry.settings

    SETTINGS.update({'apikey': settings['xing.apikey'], 'apisecret': settings['xing.apisecret'],
                     'consumer': Consumer(settings['xing.apikey'], settings['xing.apisecret'])})


class SocialResource(RootSocialResource):
    getCodeEndpoint = "https://api.xing.com/v1/request_token"
    codeEndpoint = "https://api.xing.com/v1/authorize"
    getTokenEndpoint = "https://api.xing.com/v1/access_token"
    profileEndpoint = "https://api.xing.com/v1/users/me"

    positionsEndpoint = "https://api.xing.com/v1/users/me"
    educationEndpoint = "https://api.xing.com/v1/users/me"
    companyEndpoint = "https://api.xing.com/v1/users/me"


def redirect_view(context, request):
    context.start_process(request)
    params = {'oauth_callback': request.route_url('api_connect_xing_cb')}

    client = Client(SETTINGS['consumer'])
    resp = client.request(context.getCodeEndpoint, method="POST", params=params, headers={'Accept': 'application/json'})
    result = dict(parse_qsl(resp.content))
    token = result.get("oauth_token")
    secret = result.get("oauth_token_secret")
    if resp.status_code != 201 or not (token and secret):
        raise SocialNetworkException(resp.content)
    request.session['SOCIAL_TOKEN_{}'.format(SETTINGS['network'])] = Token(token, secret)
    params = urllib.urlencode({'oauth_token': token})
    raise HTTPFound("{}?{}".format(context.codeEndpoint, params))


def token_func(context, request):
    tokenSecret = request.session.pop('SOCIAL_TOKEN_{}'.format(SETTINGS['network']))
    verifier = request.params.get('oauth_verifier')
    if not (tokenSecret and verifier):
        raise SocialNetworkException("{} Login Failed".format(SETTINGS['network']))
    tokenSecret.set_verifier(verifier)
    client = Client(SETTINGS['consumer'], tokenSecret)
    return client.request(context.getTokenEndpoint, method="POST", headers={'Accept': 'application/json'})


def profile_func(resp, context, request):
    result = dict(parse_qsl(resp.content))
    token = result.get('oauth_token')
    secret = result.get('oauth_token_secret')
    user_id = result.get('user_id')
    if not (token and secret and user_id):
        raise SocialNetworkException('error')

    access_token = Token(token, secret)
    client = Client(SETTINGS['consumer'], access_token)
    return access_token, client.request('{}'.format(context.profileEndpoint), method="GET")


def getBestProfilePicture(pictures):
    preference = ["maxi_thumb", "large", "thumb", "medium_thumb", "mini_thumb"]
    for name in preference:
        if pictures.get('name'):
            return pictures.get('name')
    return SETTINGS['default_picture']


def parse_profile_func(token, response, context, request):
    profiles = response.json()
    profile = profiles.get('users', [])
    if not profile:
        return None
    profile = profile[0]
    picture = getBestProfilePicture(profile.get('photo_urls', []))

    return dict(network=SETTINGS['network'], id=profile['id'], accessToken=token.key, secret=token.secret,
                picture=picture, email=profile['active_email'],
                name=u"{first_name} {last_name}".format(**profile))


get_profile = assemble_profile_procs(SETTINGS, token_func, profile_func, parse_profile_func)


def callback_view(context, request):
    profile = get_profile(context, request)
    result = SocialLoginSuccessful(profile)
    request.session['xing'] = profile
    raise HTTPFound(location=result.get_redirection(request))


@logged_in_with('xing')
def view_me(ctxt, request):
    return request.session['xing']


def forget_my_profile(ctxt, request):
    if 'xing' in request.session:
        del request.session['xing']
    return {'success': True}


def get_user(context, token, secret):
    access_token = Token(token, secret)
    client = Client(SETTINGS['consumer'], access_token)
    resp = client.request('{}'.format(context.profileEndpoint), method="GET")
    if resp.status_code != 200:
        raise HTTPForbidden("Some Error from Xing, %s:%s" % (resp.status_code, resp.text))
    else:
        return resp.json()['users'][0]


@logged_in_with('xing')
def view_my_positions(context, request):
    profile = request.session['xing']
    token = profile['accessToken']
    secret = profile['secret']
    user = get_user(context, token, secret)
    exps = user['professional_experience']

    def resolveDate(d):
        if d:
            v = d.split('-')
            return '{}-{}-{}'.format(*(v + [1] * (3-len(v))))
        else:
            return None
    experiences = []
    for p in exps.get('companies', []):

        p['begin_date'] = resolveDate(p.get('begin_date'))
        p['end_date'] = resolveDate(p.get('end_date'))

        experiences.append({
            'start': p['begin_date'],
            'end': p.get('end_date'),
            'role': p.get('title'),
            'country_iso': 'DE',
            'company': p.get('name')})
    return experiences


@logged_in_with('xing')
def view_my_education(context, request):
    profile = request.session['xing']
    access_token = profile['accessToken']
    results = requests.get(context.educationEndpoint, params={'oauth2_access_token': access_token},
                           headers={'x-li-format': 'json'})
    exp = results.json()
    if results.status_code != 200:
        raise HTTPForbidden("Some Error from Xing, %s:%s" % (results.status_code, results.text))
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


@logged_in_with('xing')
def view_my_profile(context, request):
    profile = request.session['xing']
    access_token = profile['accessToken']
    results = requests.get(context.profileEndpoint, params={'oauth2_access_token': access_token},
                           headers={'x-li-format': 'json'})
    exp = results.json()
    if results.status_code != 200:
        raise HTTPForbidden("Some Error from Xing, %s:%s" % (results.status_code, results.text))
    return translate(exp)
