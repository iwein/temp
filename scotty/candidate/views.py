from datetime import datetime
import logging

from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden, HTTPConflict, HTTPFound, HTTPBadRequest
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from scotty.auth.provider import ADMIN_PERM
from scotty.tools import split_strip
from sqlalchemy import or_, and_, func, String
from sqlalchemy.sql.expression import cast
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, joinedload_all

from scotty import DBSession
from scotty.candidate.models import Candidate, Education, WorkExperience, FullCandidate, CandidateOffer, \
    CandidateBookmarkEmployer, CandidateEmployerBlacklist, CandidateStatus, PreferredLocation, TargetPosition, \
    CandidateSkill, V_CANDIDATE_FT_INDEX
from scotty.candidate.services import candidate_from_signup, candidate_from_login, add_candidate_education, \
    add_candidate_work_experience, set_target_position, set_languages_on_candidate, set_skills_on_candidate, \
    set_preferredlocations_on_candidate, edit_candidate, get_candidates_by_techtags_pager, get_candidate_newsfeed, \
    set_candidate_work_experiences, set_candidate_education
from scotty.configuration.models import RejectionReason, Skill, City, Role, Country
from scotty.employer.models import Employer
from scotty.employer.services import get_employers_pager
from scotty.models.common import get_by_name_or_raise, get_location_by_name_or_raise
from scotty.offer.models import InvalidStatusError, NewsfeedOffer, AnonymisedCandidateOffer, Offer
from scotty.offer.services import set_offer_signed, get_offer_newsfeed
from scotty.services.pagingservice import ObjectBuilder, PseudoPager
from scotty.services.pwd_reset import requestpassword, validatepassword, resetpassword
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE, PUT, run_paginated_query


log = logging.getLogger(__name__)


def includeme(config):
    config.add_route('candidates', '')
    config.add_route('candidate_login', 'login')
    config.add_route('candidate_logout', 'logout')
    config.add_route('candidate_requestpassword', 'requestpassword')
    config.add_route('candidate_resetpassword', 'resetpassword/{token}')
    config.add_route('candidate_activate', 'activate/{token}')
    config.add_route('candidates_advanced_search', 'advancedsearch')

    config.add_route('candidate_offer_timeline', '{candidate_id}/offers/{id}/timeline')
    config.add_route('candidate_offer_newsfeed', '{candidate_id}/offers/{id}/newsfeed')
    config.add_route('candidate_signup_stage', '{candidate_id}/signup_stage')
    config.add_route('candidate_profile_completion', '{candidate_id}/profile_completion')
    config.add_route('candidate', '{candidate_id}')
    config.add_route('candidate_picture', '{candidate_id}/picture')
    config.add_route('candidate_skills', '{candidate_id}/skills')
    config.add_route('candidate_preferred_locations', '{candidate_id}/preferred_locations')
    config.add_route('target_position', '{candidate_id}/target_position')

    config.add_route('candidate_languages', '{candidate_id}/languages')

    config.add_route('candidate_educations', '{candidate_id}/education')
    config.add_route('candidate_education', '{candidate_id}/education/{id}')

    config.add_route('candidate_bookmarks', '{candidate_id}/bookmarks')
    config.add_route('candidate_bookmark', '{candidate_id}/bookmarks/{id}')

    config.add_route('candidate_work_experiences', '{candidate_id}/work_experience')
    config.add_route('candidate_work_experience', '{candidate_id}/work_experience/{id}')

    config.add_route('candidate_suggested_companies', '{candidate_id}/suggested_companies')
    config.add_route('candidate_newsfeed', '{candidate_id}/newsfeed')

    config.add_route('candidate_offers', '{candidate_id}/offers')
    config.add_route('candidate_offer', '{candidate_id}/offers/{id}')

    config.add_route('candidate_offer_accept', '{candidate_id}/offers/{id}/accept')
    config.add_route('candidate_offer_reject', '{candidate_id}/offers/{id}/reject')
    config.add_route('candidate_offer_status', '{candidate_id}/offers/{id}/status')
    config.add_route('candidate_offer_signed', '{candidate_id}/offers/{id}/signed')

    config.scan()


class CandidateController(RootController):
    model_cls = FullCandidate

    @reify
    def is_me(self):
        candidate_id = self.request.matchdict["candidate_id"]
        return candidate_id == 'me'

    @reify
    def candidate(self):
        candidate_id = self.request.matchdict["candidate_id"]
        if candidate_id == 'me':
            candidate_id = self.request.candidate_id
            if not candidate_id:
                raise HTTPForbidden("Not logged in.")
        candidate = DBSession.query(self.model_cls).options(joinedload_all('skills.skill'),
                                                            joinedload_all('skills.level'),
                                                            joinedload_all('languages.language'),
                                                            joinedload_all('languages.proficiency'),
                                                            joinedload_all('work_experience.company'),
                                                            joinedload_all('work_experience.skills')).get(candidate_id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        return candidate

    @reify
    def is_me(self):
        candidate_id = self.request.matchdict["candidate_id"]
        session_candidate_id = self.request.session.get('candidate_id')
        return candidate_id == session_candidate_id or self.candidate and candidate_id == 'me'

    @view_config(route_name='candidates', permission=NO_PERMISSION_REQUIRED, **POST)
    def signup(self):
        candidate = candidate_from_signup(self.request.json)
        DBSession.add(candidate)
        try:
            DBSession.flush()
        except IntegrityError:
            raise HTTPConflict("User already signed up!")
        self.request.session['candidate_id'] = candidate.id
        self.request.emailer.send_candidate_welcome(candidate.email, candidate.first_name, candidate.activation_token)
        candidate.activation_sent = datetime.now()
        return candidate


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

    @view_config(route_name='candidate_logout', permission=NO_PERMISSION_REQUIRED, **GET)
    def logout(self):
        self.request.session.invalidate()
        return {'success': True}

    @view_config(route_name='candidate', **PUT)
    def edit(self):
        candidate = edit_candidate(self.candidate, self.request.json)
        return candidate

    @view_config(route_name='candidate', permission=ADMIN_PERM, **DELETE)
    def delete(self):
        self.candidate.status = get_by_name_or_raise(CandidateStatus, CandidateStatus.DELETED)
        if self.is_me:
            return self.logout()
        return {"status": "success"}

    @view_config(route_name='candidate_signup_stage', **GET)
    def signup_stage(self):
        candidate = self.candidate
        workflow = {'active': candidate.activated is not None,
                    'approved': candidate.status.name == CandidateStatus.ACTIVE,
                    'ordering': ['target_position', 'work_experience', 'education', 'skills', 'languages', 'image',
                                 'approved', 'active'], 'image': candidate.picture_url is not None,
                    'languages': len(candidate.languages) > 0, 'skills': len(candidate.skills) > 0,
                    'target_position': candidate.target_position is not None,
                    'work_experience': len(candidate.work_experience) > 0, 'education': len(candidate.education) > 0}
        return workflow

    @view_config(route_name='candidate_profile_completion', **GET)
    def profile_completion(self):
        candidate = self.candidate
        workflow = {'active': candidate.activated is not None, 'ordering': ['summary', 'availability'],
                    'summary': bool(candidate.summary), 'availability': bool(candidate.availability)}
        return workflow


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

    @view_config(route_name='candidate_preferred_locations', **PUT)
    def set_preferred_cities(self):
        return set_preferredlocations_on_candidate(self.candidate, self.request.json)

    @view_config(route_name='candidate_preferred_locations', **GET)
    def list_preferred_cities(self):
        return self.candidate.get_preferred_locations()

    @view_config(route_name='candidate_skills', **PUT)
    def set_skills(self):
        return set_skills_on_candidate(self.candidate, self.request.json)

    @view_config(route_name='candidate_skills', **GET)
    def list_skills(self):
        return self.candidate.skills


class CandidateViewController(CandidateController):
    @view_config(route_name='candidates_advanced_search', **POST)
    def candidates_advanced_search(self):
        params = self.request.json

        offset = int(self.request.params.get('offset', 0))
        limit = int(self.request.params.get('limit', 10))
        skills = params.get('skills')
        locations = params.get('locations')
        role = params.get('role')
        salary = params.get('salary')
        status = get_by_name_or_raise(CandidateStatus, self.request.params.get('status', CandidateStatus.ACTIVE))

        query = DBSession.query(Candidate.id).filter(Candidate.status == status)
        if locations:
            query = query.join(PreferredLocation)

            country_filter = set([c['country_iso'] for c in locations])
            city_filter = [and_(City.name == loc['city'], City.country_iso == loc['country_iso']) for loc in locations]
            city_ids = DBSession.query(City.id).filter(or_(*city_filter)).all()

            query = query.filter(or_(PreferredLocation.city_id.in_(city_ids),
                                     PreferredLocation.country_iso.in_(country_filter)))

        if salary or role:
            query = query.join(TargetPosition)
            if salary:
                query = query.filter(TargetPosition.minimum_salary < salary)
            if role:
                role = get_by_name_or_raise(Role, role)
                query = query.filter(TargetPosition.role_id == role.id)

        query = query.group_by(Candidate.id)

        if skills:
            query = query.join(CandidateSkill).join(Skill).filter(Skill.name.in_(skills)) \
                .having(func.count(Skill.name) == len(skills))

        pager = PseudoPager(query, offset, limit)

        def optimise_query(q):
            return q.options(joinedload_all('languages.language'), joinedload_all('languages.proficiency'),
                             joinedload_all('skills.skill'), joinedload_all('skills.level'),
                             joinedload('preferred_locations'), joinedload_all('target_position.role'),
                             joinedload_all('target_position.skills'))

        return ObjectBuilder(Candidate, joins=optimise_query).serialize(pager)

    @view_config(route_name='candidates', **GET)
    def search(self):
        params = self.request.params
        offset = int(params.get('offset', 0))
        limit = int(params.get('limit', 10))
        status = params.get('status', CandidateStatus.ACTIVE)

        terms = params.get('q', '').replace(' ', '&')
        if terms:
            query = DBSession.query(V_CANDIDATE_FT_INDEX.c.id).filter(V_CANDIDATE_FT_INDEX.c.status == status)
            query = query.filter(V_CANDIDATE_FT_INDEX.c.search_index.match(terms, postgresql_regconfig='english'))
        else:
            status = get_by_name_or_raise(CandidateStatus, status)
            query = DBSession.query(Candidate.id).filter(Candidate.status == status)

        pager = PseudoPager(query, offset, limit)

        def optimise_query(q):
            return q.options(joinedload_all('languages.language'), joinedload_all('languages.proficiency'),
                             joinedload_all('skills.skill'), joinedload_all('skills.level'),
                             joinedload('preferred_locations'), joinedload_all('target_position.role'),
                             joinedload_all('target_position.skills'))

        return ObjectBuilder(Candidate, joins=optimise_query).serialize(pager)


    @view_config(route_name='candidate', **GET)
    def get(self):
        return self.candidate

    @view_config(route_name='candidate_picture', **GET)
    def get_picture(self):
        if self.request.params.get('redirect') == 'false':
            return {'url': self.candidate.picture_url}
        else:
            raise HTTPFound(location=self.candidate.picture_url)


class CandidateEducationController(CandidateController):
    model_cls = Candidate

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

    @view_config(route_name='candidate_educations', **PUT)
    def set(self):
        return set_candidate_education(self.candidate, self.request.json)


class CandidateWorkExperienceController(CandidateController):
    model_cls = Candidate

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

    @view_config(route_name='candidate_work_experiences', **PUT)
    def set(self):
        return set_candidate_work_experiences(self.candidate, self.request.json)


class CandidateTargetPositionController(CandidateController):
    model_cls = Candidate

    @view_config(route_name='target_position', **GET)
    def get(self):
        return self.candidate.target_position

    @view_config(route_name='target_position', **POST)
    def set(self):
        return set_target_position(self.candidate, self.request.json)


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
        bm = CandidateBookmarkEmployer(employer=employer)
        # special treatment, because of sub-classed candidate
        bm.candidate_id = self.candidate.id
        DBSession.add(bm)
        DBSession.flush()

        self.request.emailer.send_employer_joboffer_requested(employer.email,
                                                              employer.contact_name,
                                                              employer.company_name,
                                                              candidate_name=self.candidate.full_name,
                                                              candidate_id=self.candidate.id)
        return self.candidate.bookmarked_employers

    @view_config(route_name='candidate_bookmark', **DELETE)
    def delete(self):
        employer_id = self.request.matchdict['id']
        DBSession.query(CandidateBookmarkEmployer).filter(
            CandidateBookmarkEmployer.candidate_id == self.candidate.id).delete()
        self.candidate.bookmarked_employers = [e for e in self.candidate.bookmarked_employers if str(e.id) !=
                                               employer_id]
        return {"status": "success"}


class CandidateOfferController(CandidateController):
    @reify
    def offer(self):
        offer_id = self.request.matchdict["id"]
        offer = DBSession.query(CandidateOffer).get(offer_id)
        if not offer:
            raise HTTPNotFound("Unknown Candidate ID")
        elif offer.candidate_id != self.candidate.id:
            raise HTTPForbidden("Offer not for this candidate.")
        return offer

    @view_config(route_name='candidate_offer_timeline', **GET)
    @view_config(route_name='candidate_offer_newsfeed', **GET)
    def offer_newsfeed(self):
        offer_id = self.request.matchdict["id"]
        offer = DBSession.query(CandidateOffer).get(offer_id)
        if not offer:
            raise HTTPNotFound("Unknown Offer ID")
        elif offer.candidate_id != self.candidate.id:
            raise HTTPForbidden("Offer not for this candidate.")
        return get_offer_newsfeed(offer, employer=offer.employer)

    @view_config(route_name='candidate_offers', **GET)
    def list(self):
        if self.is_me:
            return self.candidate.offers
        else:
            offers = DBSession.query(AnonymisedCandidateOffer).filter(NewsfeedOffer.by_active())\
                .filter(Offer.candidate_id == self.candidate.id).all()
            return offers

    @view_config(route_name='candidate_offer', **GET)
    def get(self):
        return self.offer

    # ================== OFFER STATUS ===============

    @view_config(route_name='candidate_offer_accept', **POST)
    def accept(self):
        offer = self.offer
        try:
            offer.accept(**self.request.json)
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()

        self.request.emailer.send_employer_offer_accepted(email=offer.employer.email,
                                                          candidate_name=self.candidate.full_name,
                                                          contact_name=offer.employer.contact_name,
                                                          company_name=offer.employer.company_name,
                                                          offer_id=offer.id,
                                                          candidate_id=self.candidate.id)
        return offer.full_status_flow

    @view_config(route_name='candidate_offer_reject', **POST)
    def reject(self):
        offer = self.offer
        reason = get_by_name_or_raise(RejectionReason, self.request.json['reason'])
        try:
            offer.set_rejected(reason, self.request.json.get('rejected_text'))
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)

        DBSession.flush()

        if self.request.json.get('blacklist'):
            employer = DBSession.query(Employer).get(offer.employer.id)
            try:
                b = CandidateEmployerBlacklist(employer=employer)
                # special treatment, because of sub-classed candidate
                b.candidate_id = self.candidate.id
                DBSession.add(b)
                DBSession.flush()
            except IntegrityError, e:
                # alreadyblacklisted
                log.info(e)

        self.request.emailer.send_employer_offer_rejected(email=offer.employer.email,
                                                          candidate_name=self.candidate.full_name,
                                                          contact_name=offer.employer.contact_name,
                                                          company_name=offer.employer.company_name,
                                                          offer_id=offer.id, candidate_id=self.candidate.id)
        return offer.full_status_flow

    @view_config(route_name='candidate_offer_status', **POST)
    def set_status(self):
        try:
            self.offer.set_status(self.request.json['status'])
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        return self.offer.full_status_flow

    @view_config(route_name='candidate_offer_status', **GET)
    def get_status(self):
        return self.offer.full_status_flow

    @view_config(route_name='candidate_offer_signed', **POST)
    def contract_signed(self):
        try:
            offer = set_offer_signed(self.offer, self.request.json, self.request.emailer)
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return offer.full_status_flow


class CandidatePasswordController(RootController):
    def send_email(self, candidate):
        self.request.emailer.send_candidate_pwdforgot(candidate.email, candidate.first_name, candidate.pwdforgot_token)

    @view_config(route_name='candidate_requestpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def requestpassword(self):
        email = self.request.json['email']
        resend = bool(self.request.json.get('resend'))
        return requestpassword(Candidate, email, resend, self.send_email)

    @view_config(route_name='candidate_resetpassword', permission=NO_PERMISSION_REQUIRED, **GET)
    def validatepassword(self):
        token = self.request.matchdict['token']
        return validatepassword(Candidate, token)

    @view_config(route_name='candidate_resetpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def resetpassword(self):
        token = self.request.matchdict['token']
        pwd = self.request.json['pwd']
        return resetpassword(Candidate, token, pwd)


class CandidateDashboardController(CandidateController):
    @view_config(route_name='candidate_newsfeed', **GET)
    def get_newsfeed(self):
        candidate = self.candidate
        results = get_candidate_newsfeed(candidate)
        return results

    @view_config(route_name='candidate_suggested_companies', **GET)
    def candidate_suggested_companies(self):
        skills = [skill.name for skill in self.candidate.skills]
        if not skills:
            return {'data': [], 'pagination': {'total': 0}}

        pager = get_employers_pager(skills, self.candidate.location_id, None)
        if not pager.ids:
            pager = get_employers_pager(skills, None, None)

        return ObjectBuilder(Employer).serialize(pager)
