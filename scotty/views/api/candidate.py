from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Candidate, Education, WorkExperience, TargetPosition
from scotty.services.candidateservice import candidate_from_signup, candidate_from_login,  add_candidate_education, \
    add_candidate_work_experience, add_candidate_target_position, set_languages_on_candidate, set_skills_on_candidate, \
    set_preferredcities_on_candidate
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE, PUT
from sqlalchemy.orm import joinedload

class CandidateController(RootController):

    @reify
    def candidate(self):
        id = self.request.matchdict["id"]
        candidate = DBSession.query(Candidate).get(id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        return candidate

    @view_config(route_name='candidates', **POST)
    def signup(self):
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
        return self.candidate

    @view_config(route_name='candidate', **DELETE)
    def delete(self):
        DBSession.delete(self.candidate)
        return {"status": "success"}

    @view_config(route_name='candidate_languages', **PUT)
    def set_languages(self):
        return set_languages_on_candidate(self.candidate, self.request.json)

    @view_config(route_name='candidate_languages', **GET)
    def list_languages(self):
        return self.candidate.languages

    @view_config(route_name='candidate_preferred_cities', **PUT)
    def set_preferred_cities(self):
        return set_preferredcities_on_candidate(self.candidate, self.request.json)

    @view_config(route_name='candidate_preferred_cities', **GET)
    def list_preferred_cities(self):
        return self.candidate.preferred_cities

    @view_config(route_name='candidate_skills', **PUT)
    def set_skills(self):
        return set_skills_on_candidate(self.candidate, self.request.json)

    @view_config(route_name='candidate_skills', **GET)
    def list_skills(self):
        return self.candidate.skills



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
        education = DBSession.query(Education).get(id)
        if not education:
            raise HTTPNotFound("Unknown Education ID.")
        DBSession.delete(education)
        return {"status": "success"}


class CandidateWorkExperienceController(RootController):

    def __init__(self, request):
        candidate_id = request.matchdict["candidate_id"]
        self.candidate = DBSession.query(Candidate).options(joinedload("work_experience").joinedload("location"),
                                                            joinedload("work_experience").joinedload("role"),
                                                            joinedload("work_experience").joinedload("job_title"),
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


class CandidateTargetPositionController(RootController):

    def __init__(self, request):
        candidate_id = request.matchdict["candidate_id"]
        self.candidate = DBSession.query(Candidate).options(joinedload("target_positions").joinedload("role"),
                                                            joinedload("target_positions").joinedload("skill"),
                                                            joinedload("target_positions").joinedload("company_type"),
                                                            joinedload("target_positions").joinedload("seniority")).get(candidate_id)
        if not self.candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        super(CandidateTargetPositionController, self).__init__(request)

    @view_config(route_name='candidate_target_positions', **GET)
    def list(self):
        return self.candidate.target_positions

    @view_config(route_name='candidate_target_positions', **POST)
    def create(self):
        return add_candidate_target_position(self.candidate, self.request.json)

    @view_config(route_name='candidate_target_position', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        we = DBSession.query(TargetPosition).get(id)
        if not we:
            raise HTTPNotFound("Unknown TargetPosition ID.")
        DBSession.delete(we)
        return {"status": "success"}


def includeme(config):
    config.add_route('candidates', '')
    config.add_route('candidate_login', 'login')
    config.add_route('candidate', '{id}')

    config.add_route('candidate_skills', '{id}/skills')
    config.add_route('candidate_preferred_cities', '{id}/preferred_cities')
    config.add_route('candidate_languages', '{id}/languages')

    config.add_route('candidate_educations', '{candidate_id}/education')
    config.add_route('candidate_education', '{candidate_id}/education/{id}')

    config.add_route('candidate_work_experiences', '{candidate_id}/work_experience')
    config.add_route('candidate_work_experience', '{candidate_id}/work_experience/{id}')

    config.add_route('candidate_target_positions', '{candidate_id}/target_positions')
    config.add_route('candidate_target_position', '{candidate_id}/target_positions/{id}')
