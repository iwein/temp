from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Employer, Office
from scotty.services.employerservice import employer_from_signup, employer_from_login, add_employer_office
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE
from sqlalchemy.orm import joinedload


class EmployerController(RootController):

    @reify
    def employer(self):
        id = self.request.matchdict["id"]
        employer = DBSession.query(Employer).get(id)
        if not employer:
            raise HTTPNotFound("Unknown Employer ID")
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
        return employer

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
    config.add_route('employers', '')
    config.add_route('employer_login', 'login')
    config.add_route('employer', '{id}')
    config.add_route('employer_offices', '{employer_id}/offices')
    config.add_route('employer_office', '{employer_id}/offices/{id}')