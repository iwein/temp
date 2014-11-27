"""
Authentication works in 2 stages:

"""

import logging

from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.security import Allow, ALL_PERMISSIONS, Authenticated, Everyone


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
        super(AuthProvider, self).__init__()

    def authenticated_userid(self, request):
        return request.session.get('candidate_id')

    def unauthenticated_userid(self, request):
        return None

    def effective_principals(self, request, *args, **kwargs):
        principals = [Everyone]
        principals += [ADMIN_USER]  # TODO: at some time not everyone should be superuser

        if request.candidate_id or request.employer_id:
            principals += [Authenticated]
        if request.candidate_id:
            principals += [CANDIDATE]
        if request.employer_id:
            principals += [EMPLOYER]
        return principals
