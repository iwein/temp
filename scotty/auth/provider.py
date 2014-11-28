"""
Authentication works in 2 stages:

"""

import logging

from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.security import Allow, ALL_PERMISSIONS, Authenticated, Everyone
from scotty.tools import split_strip


ADMIN_USER = 'ADMIN_USER'
CANDIDATE = 'CANDIDATE'
EMPLOYER = 'EMPLOYER'

log = logging.getLogger(__name__)


class RootResource(object):
    """
    Central Principal -> Permission Translation
    """
    __acl__ = [
        (Allow, Authenticated, ALL_PERMISSIONS)
    ]

    def __init__(self, request):
        self.request = request


def get_candidate_id(request):
    return request.session.get('candidate_id')


def get_employer_id(request):
    return request.session.get('employer_id')


class AuthProvider(CallbackAuthenticationPolicy):
    """
    Central handler for all things authentication related.
    3Scale integration.
    """

    def __init__(self, settings):
        self.whitelist = split_strip(settings.get('auth.whitelist'))
        super(AuthProvider, self).__init__()

    def authenticated_userid(self, request):
        return request.session.get('candidate_id') or request.session.get('employer_id')

    def unauthenticated_userid(self, request):
        return None

    def effective_principals(self, request, *args, **kwargs):
        principals = {Everyone}

        if request.candidate_id:
            principals = principals | {Authenticated, CANDIDATE}
        if request.employer_id:
            principals = principals | {Authenticated, EMPLOYER}
        if request.params.get('apikey') in self.whitelist:
            principals = principals | {Authenticated, ADMIN_USER}
        return principals
