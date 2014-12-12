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
from scotty.services.pwd_reset import requestpassword, validatepassword, resetpassword
from scotty.views import RootController
from scotty.views.common import POST, GET

__author__ = 'martin'


def includeme(config):
    config.add_route('login', 'login')
    config.add_route('requestpassword', 'requestpassword')
    config.add_route('resetpassword', 'resetpassword/{token}')


def get_login(email=None, pwd=None, token=None):
    login = DBSession.query(UnifiedLogin)
    if email:
        login = login.filter(UnifiedLogin.email == email)
    if pwd:
        login = login.filter(UnifiedLogin.pwd == pwd)
    if token:
        login = login.filter(UnifiedLogin.pwdforgot_token == token)
    login = login.first()
    lookup = {'employer': Employer, 'candidate': Candidate}
    return login, lookup[login.table_name]


@view_config(route_name='login', permission=NO_PERMISSION_REQUIRED, **POST)
def login(context, request):
    params = request.json
    email = params['email']
    pwd = hashlib.sha256(params['pwd']).hexdigest()
    login_obj, cls = get_login(email=email, pwd=pwd)
    user = DBSession.query(cls).filter(cls.email == email, cls.pwd == pwd).first()
    request.session['%s_id' % login_obj.table_name] = user.id
    return {'preferred': login_obj.table_name}


class PasswordController(RootController):
    def send_email(self, candidate):
        self.request.emailer.send_candidate_pwdforgot(candidate.email, candidate.first_name, candidate.pwdforgot_token)

    @view_config(route_name='requestpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def requestpassword(self):
        email = self.request.json['email']
        login_bj, cls = get_login(email=email)
        resend = bool(self.request.json.get('resend'))
        return requestpassword(cls, email, resend, self.send_email)

    @view_config(route_name='resetpassword', permission=NO_PERMISSION_REQUIRED, **GET)
    def validatepassword(self):
        token = self.request.matchdict['token']
        login_bj, cls = get_login(token=token)
        return validatepassword(cls, token)

    @view_config(route_name='resetpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def resetpassword(self):
        token = self.request.matchdict['token']
        pwd = self.request.json['pwd']
        login_bj, cls = get_login(token=token)
        return resetpassword(cls, token, pwd)