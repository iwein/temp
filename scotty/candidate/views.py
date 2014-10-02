from datetime import datetime

from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden, HTTPConflict, HTTPFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from scotty import DBSession
from scotty.candidate.models import Candidate, Education, WorkExperience, TargetPosition, FullCandidate, \
    MatchedCandidate, CandidateOffer
from scotty.candidate.services import candidate_from_signup, candidate_from_login, add_candidate_education, \
    add_candidate_work_experience, add_target_position, set_languages_on_candidate, set_skills_on_candidate, \
    set_preferredlocations_on_candidate, edit_candidate, get_candidates_by_techtags
from scotty.configuration.models import RejectionReason
from scotty.employer.models import Employer
from scotty.models.common import get_by_name_or_raise, get_location_by_name_or_raise
from scotty.services.pwd_reset import requestpassword, validatepassword, resetpassword
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE, PUT
from sqlalchemy import or_, func
from sqlalchemy.exc import IntegrityError
import logging
from sqlalchemy.orm import joinedload, joinedload_all

log = logging.getLogger(__name__)

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
        self.request.emailer.send_candidate_welcome(candidate.email, candidate.first_name, candidate.activation_token)
        candidate.activation_sent = datetime.now()
        return candidate

    @view_config(route_name='candidates', **GET)
    def search(self):
        params = self.request.params
        tags = filter(None, params.get('tags', '').split(','))
        city_id = None
        if 'country_iso' in params and 'city' in params:
            city_id = get_location_by_name_or_raise(params).id

        base_query = DBSession.query(MatchedCandidate).options(joinedload_all('languages.language'),
                                                               joinedload_all('languages.proficiency'),
                                                               joinedload_all("work_experience.skills"),
                                                               joinedload('skills'),
                                                               joinedload('preferred_locations'))
        if tags:
            candidate_lookup = get_candidates_by_techtags(tags, city_id)
            candidates = base_query.filter(MatchedCandidate.id.in_(candidate_lookup.keys())).limit(20).all()
            for candidate in candidates:
                candidate.matched_tags = candidate_lookup[str(candidate.id)]
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
        workflow = {'active': candidate.activated is not None,
                    'ordering': ['target_positions', 'work_experience', 'education', 'skills', 'languages', 'image',
                                 'active'], 'image': candidate.picture_url is not None,
                    'languages': len(candidate.languages) > 0, 'skills': len(candidate.skills) > 0,
                    'target_positions': len(candidate.target_positions) > 0,
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

    @view_config(route_name='candidate_preferred_locations', **PUT)
    def set_preferred_cities(self):
        return set_preferredlocations_on_candidate(self.candidate, self.request.json)

    @view_config(route_name='candidate_preferred_locations', **GET)
    def list_preferred_cities(self):
        return self.candidate.get_preferred_locations

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
        DBSession.flush()

        self.request.emailer.send_employer_was_bookmarked(
            employer.email,
            employer.contact_name,
            employer.company_name,
            candidate_name=self.candidate.full_name,
            candidate_id=self.candidate.id
        )
        return self.candidate.bookmarked_employers

    @view_config(route_name='candidate_bookmark', **DELETE)
    def delete(self):
        employer_id = self.request.matchdict['id']
        self.candidate.bookmarked_employers = [e for e in self.candidate.bookmarked_employers
                                               if str(e.id) != employer_id]

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

    @view_config(route_name='candidate_offers', **GET)
    def list(self):
        return self.candidate.offers

    @view_config(route_name='candidate_offer', **GET)
    def get(self):
        return self.offer

    @view_config(route_name='candidate_offer_accept', **POST)
    def accept(self):
        offer = self.offer
        offer.accept()
        DBSession.flush()

        self.request.emailer.send_employer_offer_accepted(
            email=offer.employer.email,
            candidate_name=self.candidate.full_name,
            contact_name=offer.employer.contact_name,
            company_name=offer.employer.company_name,
            offer_id=offer.id,
            candidate_id=self.candidate.id)
        DBSession.flush()
        return offer

    @view_config(route_name='candidate_offer_hired', **POST)
    def hired(self):
        offer = self.offer
        offer.hired()
        DBSession.flush()
        self.request.emailer.send_admin_candidate_hired_email(
            candidate_name=self.candidate.full_name,
            contact_name=offer.employer.contact_name,
            company_name=offer.employer.company_name,
            offer_id=offer.id)
        DBSession.flush()
        return offer

    @view_config(route_name='candidate_offer_reject', **POST)
    def reject(self):
        offer = self.offer
        reason = get_by_name_or_raise(RejectionReason, self.request.json['reason'])
        offer.reject(reason, self.request.json.get('rejected_text'))
        DBSession.flush()

        if self.request.json.get('blacklist'):
            employer = DBSession.query(Employer).get(offer.employer.id)
            try:
                self.candidate.blacklisted_employers.append(employer)
            except IntegrityError, e:
                # alreadyblacklisted
                log.info(e)

        self.request.emailer.send_employer_offer_rejected(
            email=offer.employer.email,
            candidate_name=self.candidate.full_name,
            contact_name=offer.employer.contact_name,
            company_name=offer.employer.company_name,
            offer_id=offer.id,
            candidate_id=self.candidate.id)
        return offer


class CandidatePasswordController(RootController):
    def send_email(self, candidate):
        self.request.emailer.send_candidate_pwdforgot(
            candidate.email, candidate.first_name, candidate.pwdforgot_token)

    @view_config(route_name='candidate_requestpassword', **POST)
    def requestpassword(self):
        email = self.request.json['email']
        resend = bool(self.request.json.get('resend'))
        return requestpassword(Candidate, email, resend, self.send_email)

    @view_config(route_name='candidate_resetpassword', **GET)
    def validatepassword(self):
        token = self.request.matchdict['token']
        return validatepassword(Candidate, token)

    @view_config(route_name='candidate_resetpassword', **POST)
    def resetpassword(self):
        token = self.request.matchdict['token']
        pwd = self.request.json['pwd']
        return resetpassword(Candidate, token, pwd)