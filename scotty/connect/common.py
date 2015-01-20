from functools import wraps
from importlib import import_module
import json

from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPFound, HTTPForbidden
from pyramid.response import Response
from pyramid.view import view_config
from scotty.connect.oauth import Consumer


class SocialNetworkSettings(object):
    http_options = {'disable_ssl_certificate_validation': True}
    default_picture = "//www.gravatar.com/avatar/00000000000000000000000000000000?d=mm"
    static_prefix = "/static/"

    def __init__(self, module, network, appid, appsecret, **kwargs):
        self.module = module
        self.network = network
        self.appid = appid
        self.appsecret = appsecret
        for k, v in kwargs.items():
            setattr(self, k, v)

    @reify
    def consumer(self):
        return Consumer(self.appid, self.appsecret)


class WebsiteSettings(object):
    networks = {}

    def __init__(self, settings):
        networks = settings['network']
        for network, params in networks.items():
            moduleName = params.pop('module')
            module = import_module(moduleName)
            self.networks[network] = SocialNetworkSettings(module.SocialResource, network=network, **params)

        # so on startup time we know if it exists, it is very much required for the send button:
        self.fb_app_id = self.networks['facebook'].appid


    def toPublicJSON(self, stringify=True):
        result = {k: v.toPublicJSON(False) for k, v in self.networks.items()}
        return json.dumps(result) if stringify else result


def get_redirection(request):
    redirections = request.session.pop_flash('redirections')
    if redirections:
        return redirections[-1]
    else:
        return '/'


class RootSocialResource(object):
    def __init__(self, request):
        self.request = request

    def start_process(self, request):
        furl = request.params.get('furl')
        if furl:
            request.session.flash(furl, 'redirections')


class SocialResult(Exception):
    def get_redirection(self, request):
        return get_redirection(request)


class SocialLoginFailed(SocialResult):
    def __init__(self, msg):
        self.message = msg


class UserRejectedNotice(SocialLoginFailed): pass


class InvalidSignatureException(SocialLoginFailed): pass


class SocialNetworkException(SocialLoginFailed):
    @property
    def detail(self):
        return self.message


class ExpiredException(SocialLoginFailed): pass


class CustomProcessException(SocialLoginFailed): pass


class SocialLoginSuccessful(SocialResult):
    def __init__(self, profile):
        self.profile = profile


def assemble_profile_procs(settings, token_func, profile_func, parse_profile_func):
    """after redirect, this will do some more API magic and return the social profile"""

    def get_profile_inner(context, request):
        if request.params.get("error"):
            if 'denied' in request.params.get("error"):
                raise HTTPFound(location=get_redirection(request))
                # raise UserRejectedNotice("You need to accept {} permissions.".format(settings['network'].title()))
            else:
                # raise SocialNetworkException("{} login failed.".format(context.network.title()))
                raise HTTPFound(location=get_redirection(request))
        resp = token_func(context, request)
        if resp.status_code not in [200, 201]:
            raise SocialNetworkException("{} login failed.".format(settings['network'].title()))
        else:
            token, resp2 = profile_func(resp, context, request)
            if 400 <= resp2.status_code < 500:
                raise ExpiredException("{} login failed.".format(settings['network'].title()))
            if resp.status_code not in [200, 201]:
                raise SocialNetworkException("{} login failed.".format(settings['network'].title()))
            else:
                return parse_profile_func(token, resp2, context, request)

    return get_profile_inner


def logged_in_with(network):
    def logged_in_with_network(view):
        @wraps(view)
        def inner_view(ctxt, req):
            if 'accessToken' not in req.session.get(network, {}):
                raise HTTPForbidden("Not Connected Yet")
            else:
                return view(ctxt, req)

        return inner_view

    return logged_in_with_network


@view_config(context=SocialNetworkException)
def soc_error(exc, request):
    return Response(json.dumps({'db_message': exc.detail}), status_code=403,
                    headers=[('Content-Type', 'application/json')])


@view_config(context=UserRejectedNotice)
def user_reject_error(exc, request):
    return Response(json.dumps({'db_message': exc.detail}), status_code=403,
                    headers=[('Content-Type', 'application/json')])