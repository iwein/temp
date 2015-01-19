import logging
from operator import itemgetter
import urllib

from pyramid.httpexceptions import HTTPFound, HTTPForbidden
from pyramid.security import NO_PERMISSION_REQUIRED
import requests
from scotty.connect.common import SocialLoginSuccessful, SocialNetworkException, assemble_profile_procs, \
    logged_in_with, RootSocialResource
from scotty.connect.profile_translate import translate
from scotty.tools import ensure_list


log = logging.getLogger(__name__)
SETTINGS = {'network': 'linkedin', 'default_picture': "//www.gravatar.com/avatar/00000000000000000000000000000000?d=mm"}


def includeme(config):
    config.add_route("api_connect_linkedin", pattern="linkedin", factory=SocialResource)
    config.add_view(redirect_view, route_name="api_connect_linkedin", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_linkedin_cb", pattern="linkedin/cb", factory=SocialResource)
    config.add_view(callback_view, route_name="api_connect_linkedin_cb", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_linkedin_me", pattern="linkedin/me", factory=SocialResource)
    config.add_view(view_me, route_name="api_connect_linkedin_me", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_linkedin_me_forget", pattern="linkedin/me/forget", factory=SocialResource)
    config.add_view(forget_my_profile, route_name="api_connect_linkedin_me_forget", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_linkedin_wxp", pattern="linkedin/work_experience", factory=SocialResource)
    config.add_view(view_my_positions, route_name="api_connect_linkedin_wxp", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_linkedin_edu", pattern="linkedin/education", factory=SocialResource)
    config.add_view(view_my_education, route_name="api_connect_linkedin_edu", permission=NO_PERMISSION_REQUIRED)

    config.add_route("api_connect_linkedin_profile", pattern="linkedin/profile", factory=SocialResource)
    config.add_view(view_my_profile, route_name="api_connect_linkedin_profile", permission=NO_PERMISSION_REQUIRED)

    settings = config.registry.settings

    SETTINGS.update({'apikey': settings['linkedin.apikey'], 'apisecret': settings['linkedin.apisecret']})


class SocialResource(RootSocialResource):
    getCodeEndpoint = "https://www.linkedin.com/uas/oauth2/authorization"
    getTokenEndpoint = "https://www.linkedin.com/uas/oauth2/accessToken"
    profileEndpoint = "https://api.linkedin.com/v1/people/~:(" \
                      "id,first-name,last-name,picture-url,email-address,date-of-birth,im-accounts,main-address,location:(name,country:(code))" \
                      ")"
    positionsEndpoint = "https://api.linkedin.com/v1/people/~/positions"
    educationEndpoint = "https://api.linkedin.com/v1/people/~/educations"
    companyEndpoint = "https://api.linkedin.com/v1/companies/%(id)s:(locations)"


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

    params = {'grant_type': 'authorization_code', 'code': code,
              'redirect_uri': request.route_url('api_connect_linkedin_cb'),
              'client_id': SETTINGS['apikey'], 'client_secret': SETTINGS['apisecret']}

    return requests.post(context.getTokenEndpoint, params=params, data={})


def profile_func(resp, context, request):
    token_json = resp.json()
    access_token = token_json['access_token']
    return access_token, requests.get(context.profileEndpoint, params={'oauth2_access_token': access_token},
                                      headers={'x-li-format': 'json'})


def parse_profile_func(token, response, context, request):
    profile = response.json()
    return dict(network=SETTINGS['network'], id=profile['id'], accessToken=token,
                picture=profile.get('pictureUrl', SETTINGS['default_picture']), email=profile['emailAddress'],
                name=u"{firstName} {lastName}".format(**profile))


get_profile = assemble_profile_procs(SETTINGS, token_func, profile_func, parse_profile_func)


def callback_view(context, request):
    profile = get_profile(context, request)
    result = SocialLoginSuccessful(profile)
    request.session['linkedin'] = profile
    raise HTTPFound(location=result.get_redirection(request))


@logged_in_with('linkedin')
def view_me(ctxt, request):
    return request.session['linkedin']


def forget_my_profile(ctxt, request):
    if 'linkedin' in request.session:
        del request.session['linkedin']
    return {'success': True}


@logged_in_with('linkedin')
def view_my_positions(context, request):
    profile = request.session['linkedin']
    access_token = profile['accessToken']
    results = requests.get(context.positionsEndpoint, params={'oauth2_access_token': access_token},
                           headers={'x-li-format': 'json'})
    exp = results.json()
    if results.status_code != 200:
        raise HTTPForbidden("Some Error from Linkedin, %s:%s" % (results.status_code, results.text))
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

            # guess city iof work experience (country is not available
            cid = p.get('company', {}).get('id')
            if cid:
                locs = requests.get(context.companyEndpoint % {'id': cid}, params={'oauth2_access_token': access_token},
                                    headers={'x-li-format': 'json'})
                locations = filter(itemgetter('address'), ensure_list(locs.json(), ['locations', 'values']))
                if len(locations):
                    cities = [l['address']['city'] for l in locations if l.get('address', {}).get('city')]
                    if len(cities):
                        p['city'] = cities[0]

            experiences.append({
                'start': '%(year)04d-%(month)02d-%(day)02d' % p['startDate'],
                'end': '%(year)04d-%(month)02d-%(day)02d' % p['endDate'] if p.get('endDate') else None,
                'role': p.get('title'),
                'city': p.get('city'),
                'country_iso': 'DE',
                'company': p.get('company', {}).get('name'),
                'summary': p.get('summary')})
        return experiences


@logged_in_with('linkedin')
def view_my_education(context, request):
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


@logged_in_with('linkedin')
def view_my_profile(context, request):
    profile = request.session['linkedin']
    access_token = profile['accessToken']
    results = requests.get(context.profileEndpoint, params={'oauth2_access_token': access_token},
                           headers={'x-li-format': 'json'})
    exp = results.json()
    if results.status_code != 200:
        raise HTTPForbidden("Some Error from Linkedin, %s:%s" % (results.status_code, results.text))
    return translate(exp)
