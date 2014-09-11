from datetime import datetime
from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden, HTTPBadRequest
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Employer, Office
from scotty.services.employerservice import employer_from_signup, employer_from_login, add_employer_office, \
    update_employer
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE, PUT


class EmployerInviteController(RootController):
    @reify
    def invited_employer(self):
        token = self.request.matchdict['token']
        employer = DBSession.query(Employer).filter(Employer.invite_token == token).first()
        if not employer:
            raise HTTPNotFound("Unknown Invite Token: %s" % token)
        return employer

    @view_config(route_name='employers_invite', **GET)
    def validate_invite(self):
        return self.invited_employer

    @view_config(route_name='employers_invite', **POST)
    def respond_invite(self):
        employer = self.invited_employer
        employer.set_pwd(self.request.json['pwd'])
        self.request.session['employer_id'] = employer.id
        return employer


class EmployerController(RootController):
    @reify
    def employer(self):
        employer_id = self.request.matchdict["employer_id"]

        if employer_id == 'me':
            employer_id = self.request.session.get('employer_id')
            if not employer_id:
                raise HTTPForbidden("Not logged in.")

        employer = DBSession.query(Employer).get(employer_id)
        if not employer:
            raise HTTPNotFound("Unknown Employer ID")
        return employer

    @view_config(route_name='employers', **POST)
    def signup(self):
        employer = employer_from_signup(self.request.json)
        DBSession.add(employer)
        DBSession.flush()
        self.request.session['employer_id'] = employer.id
        return employer

    @view_config(route_name='employer_signup_stage', **GET)
    def signup_stage(self):
        employer = self.employer
        workflow = {'status': employer.status, 'ordering': ['step1', 'step2', 'step3', 'step4', 'step5'],
                    'step1': employer.address_line1 is not None, 'step2': employer.mission_text is not None,
                    'step3': len(employer.tech_tags) > 0, 'step4': employer.recruitment_process is not None,
                    'step5': employer.agreedTos is not None, }
        return workflow

    @view_config(route_name='employer', **GET)
    def get(self):
        return self.employer

    @view_config(route_name='employer', **PUT)
    def edit(self):
        update_employer(self.employer, self.request.json)
        return self.employer

    @view_config(route_name='employer_apply', **PUT)
    def employer_apply(self):
        if self.request.json['agreedTos'] != True:
            raise HTTPBadRequest("agreedTos must be true")
        employer = self.employer
        employer.agreedTos = datetime.now()
        self.request.emailer.send_pending_approval(employer.email, employer.contact_name, employer.company_name,
                                                   employer.id)
        return self.employer

    @view_config(route_name='employer', **DELETE)
    def delete(self):
        DBSession.delete(self.employer)
        return {"status": "success"}

    @view_config(route_name='employer_login', **POST)
    def login(self):
        employer = employer_from_login(self.request.json)
        if not employer:
            raise HTTPNotFound("Unknown User Email or Password.")
        self.request.session['employer_id'] = employer.id
        return employer

    @view_config(route_name='employer_logout', **GET)
    def logout(self):
        if 'employer_id' in self.request.session:
            del self.request.session['employer_id']
        return {'success': True}


class EmployerOfficeController(EmployerController):
    @view_config(route_name='employer_offices', **GET)
    def list(self):
        return self.employer.offices

    @view_config(route_name='employer_offices', **POST)
    def create(self):
        return add_employer_office(self.employer, self.request.json)

    @view_config(route_name='employer_office', **DELETE)
    def delete(self):
        id = self.request.matchdict["office_id"]
        office = DBSession.query(Office).get(id)
        if not office:
            raise HTTPNotFound("Unknown Office ID.")
        DBSession.delete(office)
        return {"status": "success"}


def includeme(config):
    config.add_route('employers_invite', 'invite/{token}')
    config.add_route('employer_login', 'login')
    config.add_route('employer_logout', 'logout')

    config.add_route('employers', '')
    config.add_route('employer', '{employer_id}')
    config.add_route('employer_signup_stage', '{employer_id}/signup_stage')
    config.add_route('employer_apply', '{employer_id}/apply')
    config.add_route('employer_offices', '{employer_id}/offices')
    config.add_route('employer_office', '{employer_id}/offices/{office_id}')