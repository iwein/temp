from datetime import datetime
from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden, HTTPBadRequest, HTTPConflict
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Employer, Office, APPLIED, APPROVED, Candidate, Skill, CandidateSkill
from scotty.models.candidate import INCLUDE_WEXP
from scotty.services.employerservice import employer_from_signup, employer_from_login, add_employer_office, \
    update_employer
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE, PUT
from simplejson import OrderedDict
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload


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
        try:
            employer = employer_from_signup(self.request.json)
            DBSession.add(employer)
            DBSession.flush()
        except IntegrityError:
            raise HTTPConflict("company_name of email already registered.")
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

    @view_config(route_name='employer_suggested_candidates', **GET)
    def employer_suggested_candidates(self):
        if self.employer.status not in [APPLIED, APPROVED]:
            raise HTTPForbidden("Employer has not applied yet and is not approved")
        #TODO: add meaning full candidates
        self.request.renderer_options['Candidate'] = {INCLUDE_WEXP: True}

        results = DBSession.execute(text("""
            select c.id as id, count(s.id) as noskills
                from employer e
                join employer_skills es
                    on e.id = es.employer_id
                join skill s
                    on s.id = es.skill_id
                join candidate_skill cs
                    on  cs.skill_id = s.id
                join candidate c
                    on cs.candidate_id = c.id
                where e.id = :employer_id
                group by c.id
                order by noskills desc
        """), {'employer_id': str(self.employer.id)})

        # TODO: order results sometime
        candidate_ids = [r[0] for r in results]

        candidates = DBSession.query(Candidate).options(joinedload("languages"),
                                                        joinedload("skills"),
                                                        joinedload("work_experience"))\
            .filter(Candidate.id.in_(candidate_ids)).all()
        return candidates


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
        self.request.session.pop('employer_id', None)
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
    config.add_route('employer_suggested_candidates', '{employer_id}/suggestedcandidates')
    config.add_route('employer_signup_stage', '{employer_id}/signup_stage')
    config.add_route('employer_apply', '{employer_id}/apply')
    config.add_route('employer_offices', '{employer_id}/offices')
    config.add_route('employer_office', '{employer_id}/offices/{office_id}')