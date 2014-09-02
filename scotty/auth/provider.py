"""
Authentication works in 2 stages:

"""

import logging

from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.security import Allow, ALL_PERMISSIONS, Authenticated, Everyone


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
        user_key = self.authenticated_userid(request)
        if user_key:
            principals += [Authenticated]
        return principals
