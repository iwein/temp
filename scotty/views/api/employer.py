from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Employer, Office
from scotty.services.employerservice import employer_from_signup, employer_from_login, add_employer_office
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE
from sqlalchemy.orm import joinedload


class EmployerController(RootController):

    def get_employer(self, employer_id):
        employer = DBSession.query(Employer).get(employer_id)
        if not employer:
            raise HTTPNotFound("Unknown Employer ID")
        return employer

    @reify
    def employer(self):
        return self.get_employer(self.request.matchdict["id"])

    @reify
    def session_employer(self):
        employer_id = self.request.session.get('employer_id')
        if not employer_id:
            raise HTTPForbidden("Not logged in.")
        employer = self.get_employer(employer_id)
        if not employer:
            raise HTTPForbidden("Not logged in.")
        return employer

    @view_config(route_name='employers_invite', **GET)
    def validate_invite(self):
        token = self.request.matchdict['token']
        employer = DBSession.query(Employer).filter(Employer.invite_token == token).first()
        if not employer:
            raise HTTPNotFound("Unknown Invite Token: %s" % token)
        return employer

    @view_config(route_name='employers_invite', **POST)
    def respond_invite(self):
        token = self.request.matchdict['token']
        employer = DBSession.query(Employer).filter(Employer.invite_token == token).first()
        if not employer:
            raise HTTPNotFound("Unknown Invite Token: %s" % token)
        employer.set_pwd(self.request.json['pwd'])
        self.request.session['employer_id'] = employer.id
        return employer

    @view_config(route_name='employers', **POST)
    def signup(self):
        employer = employer_from_signup(self.request.json)
        DBSession.add(employer)
        DBSession.flush()
        return employer

    @view_config(route_name='employer_login', **POST)
    def login(self):
        employer = employer_from_login(self.request.json)
        if not employer:
            raise HTTPNotFound("Unknown User Email or Password.")
        self.request.session['employer_id'] = employer.id
        return employer

    @view_config(route_name='employer_me', **GET)
    def me(self):
        return self.session_employer

    @view_config(route_name='employer', **GET)
    def get(self):
        return self.employer

    @view_config(route_name='employer', **DELETE)
    def delete(self):
        DBSession.delete(self.employer)
        return {"status": "success"}


class EmployerOfficeController(RootController):

    def __init__(self, request):
        employer_id = request.matchdict["employer_id"]
        self.employer = DBSession.query(Employer).options(joinedload("offices")).get(employer_id)
        if not self.employer:
            raise HTTPNotFound("Unknown Employer ID")
        super(EmployerOfficeController, self).__init__(request)

    @view_config(route_name='employer_offices', **GET)
    def list(self):
        return self.employer.offices

    @view_config(route_name='employer_offices', **POST)
    def create(self):
        return add_employer_office(self.employer, self.request.json)

    @view_config(route_name='employer_office', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        office = DBSession.query(Office).get(id)
        if not office:
            raise HTTPNotFound("Unknown Office ID.")
        DBSession.delete(office)
        return {"status": "success"}



def includeme(config):
    config.add_route('employers_invite', 'invite/{token}')
    config.add_route('employers', '')
    config.add_route('employer_login', 'login')
    config.add_route('employer_me', 'me')
    config.add_route('employer', '{id}')
    config.add_route('employer_offices', '{employer_id}/offices')
    config.add_route('employer_office', '{employer_id}/offices/{id}')