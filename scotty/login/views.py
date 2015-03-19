from datetime import datetime

from pyramid.httpexceptions import HTTPNotFound, HTTPFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from scotty.models.meta import DBSession
from scotty.candidate.models import Candidate
from scotty.employer.models import Employer
from scotty.login.models import UnifiedLogin
from scotty.services import hash_pwd
from scotty.services.pwd_reset import requestpassword, validatepassword, resetpassword
from scotty.views import RootController
from scotty.views.common import POST, GET


__author__ = 'martin'


def includeme(config):
    config.add_route('login', 'login')
    config.add_route('requestpassword', 'requestpassword')
    config.add_route('resetpassword', 'resetpassword/{token}')


def get_login(email=None, pwd=None, token=None, raise_404=True):
    login = DBSession.query(UnifiedLogin)
    if email:
        login = login.filter(UnifiedLogin.email == email)
    if pwd:
        login = login.filter(UnifiedLogin.pwd == pwd)
    if token:
        login = login.filter(UnifiedLogin.pwdforgot_token == token)
    login = login.first()
    if not login:
        if raise_404:
            raise HTTPNotFound("Unknown Login.")
        else:
            return None, None
    lookup = {'employer': Employer, 'candidate': Candidate}
    return login, lookup[login.table_name]


@view_config(route_name='login', permission=NO_PERMISSION_REQUIRED, xhr=True, **POST)
def login(context, request):
    params = request.json
    email = params['email']
    pwd = hash_pwd(params['pwd'])
    login_obj, cls = get_login(email=email, pwd=pwd)
    user = DBSession.query(cls).filter(cls.email == email, cls.pwd == pwd).filter(*cls.not_deleted()).first()
    if user and user.can_login:
        user.last_login = datetime.now()
        request.session['%s_id' % login_obj.table_name] = user.id
        return {'preferred': login_obj.table_name, 'id': user.id}
    else:
        raise HTTPNotFound("Login Disabled. Please contact support.")


@view_config(route_name='login', permission=NO_PERMISSION_REQUIRED, xhr=False, request_method="POST")
def login_post(context, request):
    redirect = request.GET.get('redirect')
    params = request.POST
    email = params['email']
    pwd = hash_pwd(params['pwd'])
    login_obj, cls = get_login(email=email, pwd=pwd, raise_404=not redirect)

    if login_obj is None:
        raise HTTPFound(location=(request.referer or '/') + '#unknown')
    else:
        user = DBSession.query(cls).filter(cls.email == email, cls.pwd == pwd).filter(*cls.not_deleted()).first()
        if user and user.can_login:
            user.last_login = datetime.now()
            request.session['%s_id' % login_obj.table_name] = user.id

            if redirect:
                if login_obj.table_name == 'candidate':
                    raise HTTPFound(request.emailer.candidate_dashboard_url)
                else:
                    raise HTTPFound(request.emailer.employer_dashboard_url)

            return {'preferred': login_obj.table_name, 'id': user.id}
        else:
            raise HTTPFound(location=(request.referer or '/') + '#unknown')


class PasswordController(RootController):
    def send_email(self, obj):
        if isinstance(obj, Candidate):
            self.request.emailer.send_candidate_pwdforgot(obj.lang, obj.email, obj.first_name, obj.pwdforgot_token)
        else:
            self.request.emailer.send_employer_pwdforgot(obj.lang, obj.email, obj.contact_name,
                                                         obj.company_name, obj.pwdforgot_token)

    @view_config(route_name='requestpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def requestpassword(self):
        email = self.request.json['email']
        login_obj, cls = get_login(email=email)
        resend = bool(self.request.json.get('resend'))
        return requestpassword(cls, email, resend, self.send_email)

    @view_config(route_name='resetpassword', permission=NO_PERMISSION_REQUIRED, **GET)
    def validatepassword(self):
        token = self.request.matchdict['token']
        login_obj, cls = get_login(token=token)
        return validatepassword(cls, token)

    @view_config(route_name='resetpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def resetpassword(self):
        token = self.request.matchdict['token']
        pwd = self.request.json['pwd']
        login_obj, cls = get_login(token=token)
        return resetpassword(cls, token, pwd)