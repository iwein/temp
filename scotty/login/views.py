import hashlib
from pyramid.httpexceptions import HTTPNotFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from scotty import DBSession
from scotty.candidate.models import Candidate
from scotty.candidate.services import candidate_from_login
from scotty.employer.models import Employer
from scotty.employer.services import employer_from_login
from scotty.login.models import UnifiedLogin
from scotty.views.common import POST

__author__ = 'martin'


def includeme(config):
    config.add_route('login', 'login')


@view_config(route_name='login', permission=NO_PERMISSION_REQUIRED, **POST)
def login(context, request):
    params = request.json
    email = params['email']
    pwd = hashlib.sha256(params['pwd']).hexdigest()

    login = DBSession.query(UnifiedLogin).filter(UnifiedLogin.email == email, UnifiedLogin.pwd == pwd).first()
    lookup = {'employer': Employer, 'candidate': Candidate}

    result = {'preferred': login.table_name}
    cls = lookup[login.table_name]
    user = DBSession.query(cls).filter(cls.email == email, cls.pwd == pwd).first()
    request.session['%s_id' % login.table_name] = user.id
    return result
