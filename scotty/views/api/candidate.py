from datetime import datetime

from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden, HTTPConflict, HTTPFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Candidate, Education, WorkExperience, TargetPosition, Employer, FullCandidate
from scotty.services.candidateservice import candidate_from_signup, candidate_from_login, add_candidate_education, \
    add_candidate_work_experience, add_target_position, set_languages_on_candidate, set_skills_on_candidate, \
    set_preferredcities_on_candidate, edit_candidate, get_candidates_by_techtags
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE, PUT
from sqlalchemy.exc import IntegrityError


class CandidateController(RootController):
    @reify
    def candidate(self):
        candidate_id = self.request.matchdict["candidate_id"]
        cls = Candidate
        if candidate_id == 'me':
            candidate_id = self.request.session.get('candidate_id')
            if not candidate_id:
                raise HTTPForbidden("Not logged in.")
            cls = FullCandidate
        candidate = DBSession.query(cls).get(candidate_id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        return candidate

    @view_config(route_name='candidates', permission=NO_PERMISSION_REQUIRED, **POST)
    def signup(self):
        candidate = candidate_from_signup(self.request.json)
        DBSession.add(candidate)
        try:
            DBSession.flush()
        except IntegrityError:
            raise HTTPConflict("User already signed up!")
        self.request.session['candidate_id'] = candidate.id
        self.request.emailer.send_welcome(candidate.email, candidate.first_name, candidate.activation_token)
        candidate.activation_sent = datetime.now()
        return candidate

    @view_config(route_name='candidates', **GET)
    def search(self):
        tags = self.request.params.get('tags', '').split(',')

        base_query = DBSession.query(Candidate)
        if tags:
            candidate_lookup = get_candidates_by_techtags(tags)
            candidates = base_query.filter(Candidate.id.in_(candidate_lookup.keys())).limit(20).all()
            for candidate in candidates:
                candidate.additional_data = {'matched_tags': candidate_lookup[str(candidate.id)]}
        else:
            candidates = base_query.limit(20).all()
        return candidates

    @view_config(route_name='candidate_activate', permission=NO_PERMISSION_REQUIRED, **GET)
    def activate(self):
        token = self.request.matchdict['token']
        candidate = DBSession.query(Candidate).filter(Candidate.activation_token == token).first()
        if not candidate:
            raise HTTPNotFound("Invalid Token")
        candidate.activated = datetime.now()
        DBSession.flush()
        return {'success': True}

    @view_config(route_name='candidate_login', permission=NO_PERMISSION_REQUIRED, **POST)
    def login(self):
        candidate = candidate_from_login(self.request.json)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate Email or Password.")
        self.request.session['candidate_id'] = candidate.id
        return candidate

    @view_config(route_name='candidate_logout', **GET)
    def logout(self):
        if 'candidate_id' in self.request.session:
            del self.request.session['candidate_id']
        return {'success': True}

    @view_config(route_name='candidate', **GET)
    def get(self):
        return self.candidate

    @view_config(route_name='candidate', **PUT)
    def edit(self):
        candidate = edit_candidate(self.candidate, self.request.json)
        return candidate

    @view_config(route_name='candidate', **DELETE)
    def delete(self):
        DBSession.delete(self.candidate)
        return {"status": "success"}

    @view_config(route_name='candidate_signup_stage', **GET)
    def signup_stage(self):
        candidate = self.candidate
        workflow = {'active': candidate.activated != None,
                    'ordering': ['target_positions', 'work_experience', 'skills', 'education', 'languages', 'image',
                                 'active', ], 'image': candidate.picture_url is not None,
                    'languages': len(candidate.languages) > 0, 'skills': len(candidate.skills) > 0, 'target_positions': len(candidate.target_positions) > 0,
                    'work_experience': len(candidate.work_experience) > 0, 'education': len(candidate.education) > 0}
        return workflow

    @view_config(route_name='candidate_picture', **GET)
    def get_picture(self):
        if self.request.params.get('redirect') == 'false':
            return {'url': self.candidate.picture_url}
        else:
            raise HTTPFound(location=self.candidate.picture_url)

    @view_config(route_name='candidate_picture', **POST)
    def save_picture(self):
        url = self.request.json["url"]
        self.candidate.picture_url = url
        return self.candidate

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


class CandidateEducationController(CandidateController):
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


class CandidateWorkExperienceController(CandidateController):
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


class CandidateTargetPositionController(CandidateController):
    @view_config(route_name='target_positions', **GET)
    def list(self):
        return self.candidate.target_positions

    @view_config(route_name='target_positions', **POST)
    def create(self):
        return add_target_position(self.candidate, self.request.json)

    @view_config(route_name='target_position', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        we = DBSession.query(TargetPosition).get(id)
        if not we:
            raise HTTPNotFound("Unknown TargetPosition ID.")
        DBSession.delete(we)
        return {"status": "success"}


class CandidateBookmarkController(CandidateController):
    @view_config(route_name='candidate_bookmarks', **GET)
    def list(self):
        return self.candidate.bookmarked_employers

    @view_config(route_name='candidate_bookmarks', **POST)
    def create(self):
        employer_id = self.request.json['id']
        if employer_id in [str(e.id) for e in self.candidate.bookmarked_employers]:
            raise HTTPConflict("Employer already present.")

        employer = DBSession.query(Employer).get(employer_id)
        self.candidate.bookmarked_employers.append(employer)
        return self.candidate.bookmarked_employers

    @view_config(route_name='candidate_bookmark', **DELETE)
    def delete(self):
        employer_id = self.request.matchdict['id']

        self.candidate.bookmarked_employers = [e for e in self.candidate.bookmarked_employers if str(e.id) != employer_id]

        return {"status": "success"}


def includeme(config):
    config.add_route('candidates', '')
    config.add_route('candidate_login', 'login')
    config.add_route('candidate_logout', 'logout')
    config.add_route('candidate_activate', 'activate/{token}')

    config.add_route('candidate_signup_stage', '{candidate_id}/signup_stage')
    config.add_route('candidate', '{candidate_id}')
    config.add_route('candidate_picture', '{candidate_id}/picture')
    config.add_route('candidate_skills', '{candidate_id}/skills')
    config.add_route('candidate_preferred_cities', '{candidate_id}/preferred_cities')
    config.add_route('candidate_languages', '{candidate_id}/languages')

    config.add_route('candidate_educations', '{candidate_id}/education')
    config.add_route('candidate_education', '{candidate_id}/education/{id}')

    config.add_route('candidate_bookmarks', '{candidate_id}/bookmarks')
    config.add_route('candidate_bookmark', '{candidate_id}/bookmarks/{id}')

    config.add_route('candidate_work_experiences', '{candidate_id}/work_experience')
    config.add_route('candidate_work_experience', '{candidate_id}/work_experience/{id}')

    config.add_route('target_positions', '{candidate_id}/target_positions')
    config.add_route('target_position', '{candidate_id}/target_positions/{id}')
