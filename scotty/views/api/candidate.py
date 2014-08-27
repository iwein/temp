from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Candidate, CandidateSkill, CandidateEducation, WorkExperience
from scotty.services.candidateservice import candidate_from_signup, candidate_from_login, add_candidate_skill, \
    add_candidate_education, add_candidate_work_experience
from scotty.views import RootController
from sqlalchemy.orm import joinedload_all, joinedload

POST = dict(request_method="POST", content_type='application/json', renderer="json")
DELETE = dict(request_method="DELETE", renderer="json")
GET = dict(request_method="GET", renderer="json")

class CandidateController(RootController):

    @view_config(route_name='candidates', **POST)
    def create(self):
        candidate = candidate_from_signup(self.request.json)
        DBSession.add(candidate)
        DBSession.flush()
        return candidate

    @view_config(route_name='candidate_login', **POST)
    def login(self):
        candidate = candidate_from_login(self.request.json)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate Email or Password.")
        return candidate

    @view_config(route_name='candidate', **GET)
    def get(self):
        id = self.request.matchdict["id"]
        candidate = DBSession.query(Candidate).get(id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        return candidate

    @view_config(route_name='candidate', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        candidate = DBSession.query(Candidate).get(id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        DBSession.delete(candidate)
        return {"status": "success"}


class CandidateSkillsController(RootController):

    def __init__(self, request):
        candidate_id = request.matchdict["candidate_id"]
        self.candidate = DBSession.query(Candidate).options(joinedload("skills").joinedload("level"),
                                                            joinedload("skills").joinedload("skill")).get(candidate_id)
        if not self.candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        super(CandidateSkillsController, self).__init__(request)

    @view_config(route_name='candidate_skills', **GET)
    def list(self):
        return self.candidate.skills

    @view_config(route_name='candidate_skills', **POST)
    def create(self):
        return add_candidate_skill(self.candidate, self.request.json)

    @view_config(route_name='candidate_skill', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        skill = DBSession.query(CandidateSkill).get(id)
        if not skill:
            raise HTTPNotFound("Unknown Skill ID.")
        DBSession.delete(skill)
        return {"status": "success"}


class CandidateEducationController(RootController):

    def __init__(self, request):
        candidate_id = request.matchdict["candidate_id"]
        self.candidate = DBSession.query(Candidate).options(joinedload("education").joinedload("institution"),
                                                            joinedload("education").joinedload("degree")).get(candidate_id)
        if not self.candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        super(CandidateEducationController, self).__init__(request)

    @view_config(route_name='candidate_educations', **GET)
    def list(self):
        return self.candidate.education

    @view_config(route_name='candidate_educations', **POST)
    def create(self):
        return add_candidate_education(self.candidate, self.request.json)

    @view_config(route_name='candidate_education', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        education = DBSession.query(CandidateEducation).get(id)
        if not education:
            raise HTTPNotFound("Unknown Education ID.")
        DBSession.delete(education)
        return {"status": "success"}


class CandidateWorkExperienceController(RootController):

    def __init__(self, request):
        candidate_id = request.matchdict["candidate_id"]
        self.candidate = DBSession.query(Candidate).options(joinedload("work_experience").joinedload("location"),
                                                            joinedload("work_experience").joinedload("roles"),
                                                            joinedload("work_experience").joinedload("job_titles"),
                                                            joinedload("work_experience").joinedload("company")).get(candidate_id)
        if not self.candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        super(CandidateWorkExperienceController, self).__init__(request)

    @view_config(route_name='candidate_work_experiences', **GET)
    def list(self):
        return self.candidate.work_experience

    @view_config(route_name='candidate_work_experiences', **POST)
    def create(self):
        return add_candidate_work_experience(self.candidate, self.request.json)

    @view_config(route_name='candidate_work_experience', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        we = DBSession.query(WorkExperience).get(id)
        if not we:
            raise HTTPNotFound("Unknown WorkExperience ID.")
        DBSession.delete(we)
        return {"status": "success"}



def includeme(config):
    config.add_route('candidates', '')
    config.add_route('candidate_login', 'login')
    config.add_route('candidate', '{id}')

    config.add_route('candidate_skills', '{candidate_id}/skills')
    config.add_route('candidate_skill', '{candidate_id}/skills/{id}')

    config.add_route('candidate_educations', '{candidate_id}/education')
    config.add_route('candidate_education', '{candidate_id}/education/{id}')

    config.add_route('candidate_work_experiences', '{candidate_id}/work_experience')
    config.add_route('candidate_work_experience', '{candidate_id}/work_experience/{id}')
