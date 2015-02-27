from datetime import datetime

from pyramid.security import NO_PERMISSION_REQUIRED
from scotty.auth.provider import ADMIN_PERM
from scotty.employer.schemata import SignupRequest, AgreeTosRequest, PictureRequest, SetPicturesRequest
from scotty.models.tools import update
from sqlalchemy import func
from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden, HTTPBadRequest, HTTPConflict
from pyramid.view import view_config
from scotty.models.meta import DBSession
from scotty.configuration.models import WithdrawalReason
from scotty.employer.models import Employer, Office, APPLIED, APPROVED, EmployerOffer, FullEmployer, EmployerPicture, \
    SuggestedCandidate
from scotty.candidate.models import WXPCandidate
from scotty.employer.services import employer_from_signup, employer_from_login, add_employer_office, \
    get_employer_suggested_candidate_ids, add_employer_offer, get_employers_pager, \
    set_employer_offices, get_employer_newsfeed, EMPLOYER_OFFICE, EMPLOYER_EDITABLES
from scotty.models.common import get_location_by_name_or_raise, get_by_name_or_raise
from scotty.offer.models import InvalidStatusError
from scotty.offer.services import set_offer_signed, get_offer_newsfeed
from scotty.services.pagingservice import ObjectBuilder
from scotty.services.pwd_reset import requestpassword, validatepassword, resetpassword
from scotty.views import RootController
from scotty.views.common import POST, GET, DELETE, PUT, run_paginated_query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, joinedload_all


def includeme(config):
    config.add_route('employers_invite', 'invite/{token}')
    config.add_route('employer_login', 'login')
    config.add_route('employer_logout', 'logout')
    config.add_route('employer_requestpassword', 'requestpassword')
    config.add_route('employer_resetpassword', 'resetpassword/{token}')

    config.add_route('employers', '')
    config.add_route('employer', '{employer_id}')
    config.add_route('employer_interested_candidates', '{employer_id}/interested/candidates')
    config.add_route('employer_relevant_candidates', '{employer_id}/relevant/candidates')
    config.add_route('employer_suggested_candidates', '{employer_id}/suggested/candidates')


    config.add_route('employer_newsfeed', '{employer_id}/newsfeed')
    config.add_route('employer_signup_stage', '{employer_id}/signup_stage')
    config.add_route('employer_apply', '{employer_id}/apply')

    config.add_route('employer_offices', '{employer_id}/offices')
    config.add_route('employer_office', '{employer_id}/offices/{office_id}')

    config.add_route('employer_pictures', '{employer_id}/pictures')
    config.add_route('employer_picture', '{employer_id}/pictures/{picture_id}')

    config.add_route('employer_offers', '{employer_id}/offers')
    config.add_route('employer_offer', '{employer_id}/offers/{offer_id}')

    config.add_route('employer_offer_signed', '{employer_id}/offers/{offer_id}/signed')
    config.add_route('employer_offer_withdraw', '{employer_id}/offers/{offer_id}/withdraw')
    config.add_route('employer_offer_status', '{employer_id}/offers/{offer_id}/status')
    config.add_route('employer_offer_timeline', '{employer_id}/offers/{offer_id}/timeline')
    config.add_route('employer_offer_newsfeed', '{employer_id}/offers/{offer_id}/newsfeed')
    config.scan()


class EmployerInviteController(RootController):
    @reify
    def invited_employer(self):
        token = self.request.matchdict['token']
        employer = DBSession.query(FullEmployer).filter(FullEmployer.invite_token == token).first()
        if not employer:
            raise HTTPNotFound("Unknown Invite Token: %s" % token)
        return employer

    @view_config(route_name='employers_invite', permission=NO_PERMISSION_REQUIRED, **GET)
    def validate_invite(self):
        return self.invited_employer

    @view_config(route_name='employers_invite', permission=NO_PERMISSION_REQUIRED, **POST)
    def respond_invite(self):
        employer = self.invited_employer
        employer.password = self.request.json['pwd']
        self.request.session['employer_id'] = employer.id
        return employer


class EmployerController(RootController):
    employer_cls = FullEmployer

    @reify
    def employer(self):
        employer_id = self.request.matchdict["employer_id"]
        cls = self.employer_cls
        if employer_id == 'me':
            employer_id = self.request.session.get('employer_id')
            if not employer_id:
                raise HTTPForbidden("Not logged in.")
        employer = DBSession.query(cls).get(employer_id)
        if not employer:
            if self.request.matchdict["employer_id"] == 'me':
                self.request.session.invalidate()
                raise HTTPForbidden("Not logged in.")
            else:
                raise HTTPNotFound("Unknown Employer ID")
        return employer

    @view_config(route_name='employers', permission=NO_PERMISSION_REQUIRED, **POST)
    def signup(self):
        try:
            params = SignupRequest().deserialize(self.request.json)
            employer = employer_from_signup(params)
            DBSession.add(employer)
            DBSession.flush()
        except IntegrityError, e:
            if 'employer_company_name_key' in e.message:
                raise HTTPConflict("company_name")
            else:
                raise HTTPConflict("email")
        self.request.session['employer_id'] = employer.id
        self.request.emailer.send_employer_welcome(employer.lang, employer)
        return employer

    @view_config(route_name='employers', **GET)
    def search(self):
        params = self.request.params
        tags = filter(None, params.get('tags', '').split(','))
        city_id = None
        if 'country_iso' in params and 'city' in params:
            city_id = get_location_by_name_or_raise(params).id

        def adjust_query(query):
            return query.options(joinedload('contact_salutation'),
                                 joinedload_all('offices.address_city'),
                                 joinedload('benefits'),
                                 joinedload('tech_tags'),
                                 joinedload('company_type'))

        employer_name = params.get('company')
        if tags:
            pager = get_employers_pager(tags, city_id, employer_name)
            result = ObjectBuilder(Employer, joins=adjust_query).serialize(pager)
        else:
            basequery = DBSession.query(Employer).filter(*Employer.by_status(APPROVED)).order_by(Employer.company_name)
            basequery = adjust_query(basequery)
            if employer_name:
                basequery = basequery.filter(func.lower(Employer.company_name).like(employer_name.lower() + '%'))
            result = run_paginated_query(self.request, basequery)
        return result

    @view_config(route_name='employer_signup_stage', permission=NO_PERMISSION_REQUIRED, **GET)
    def signup_stage(self):
        employer = self.employer
        workflow = {'ordering': ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'],
                    'step1': employer.logo_url is not None, 'step2': len(employer.offices) > 0,
                    'step3': employer.mission_text is not None,
                    'step4': len(employer.tech_tags) > 0, 'step5': employer.recruitment_process is not None,
                    'step6': employer.agreedTos is not None, }
        return workflow

    @view_config(route_name='employer', **GET)
    def get(self):
        return self.employer

    @view_config(route_name='employer', **PUT)
    def edit(self):
        return update(self.employer, self.request.json, EMPLOYER_EDITABLES)

    @view_config(route_name='employer_apply', **PUT)
    def employer_apply(self):
        # raises an error if not set
        AgreeTosRequest().deserialize(self.request.json)

        employer = self.employer
        employer.agreedTos = datetime.now()
        self.request.emailer.send_admin_pending_approval(employer.email,
                                                         employer.contact_name,
                                                         employer.company_name,
                                                         employer.id)
        return self.employer

    @view_config(route_name='employer', permission=ADMIN_PERM, **DELETE)
    def delete(self):
        self.employer.deleted = datetime.now()
        return {"status": "success"}

    @view_config(route_name='employer_login', permission=NO_PERMISSION_REQUIRED, **POST)
    def login(self):
        employer = employer_from_login(self.request.json)
        if not employer:
            raise HTTPNotFound("Unknown User Email or Password.")
        self.request.session['employer_id'] = employer.id
        return employer

    @view_config(route_name='employer_logout', permission=NO_PERMISSION_REQUIRED, **GET)
    def logout(self):
        self.request.session.invalidate()
        return {'success': True}


class EmployerPictureController(EmployerController):
    employer_cls = Employer

    @view_config(route_name='employer_pictures', **GET)
    def list(self):
        return self.employer.pictures

    @view_config(route_name='employer_pictures', **POST)
    def create(self):
        params = PictureRequest().deserialize(self.request.json)
        pic = EmployerPicture(**params)
        self.employer.pictures.append(pic)
        DBSession.flush()
        return pic

    @view_config(route_name='employer_pictures', **PUT)
    def set(self):
        DBSession.query(EmployerPicture).filter(EmployerPicture.employer_id == self.employer.id).delete()
        params = SetPicturesRequest().deserialize(self.request.json)
        self.employer.pictures = [EmployerPicture(**p) for p in params]
        DBSession.flush()
        return self.employer.pictures

    @reify
    def picture(self):
        id = self.request.matchdict["picture_id"]
        picture = DBSession.query(EmployerPicture).get(id)
        if not picture:
            raise HTTPNotFound("Unknown Picture ID.")
        return picture

    @view_config(route_name='employer_picture', **GET)
    def get(self):
        return self.picture

    @view_config(route_name='employer_picture', **PUT)
    def edit(self):
        params = self.request.json
        if params.get('url'):
            self.picture.url = params['url']
        if 'description' in params:
            self.picture.description = params['description']
        return self.picture

    @view_config(route_name='employer_picture', **DELETE)
    def delete(self):
        picture = self.picture
        DBSession.delete(picture)
        return {"status": "success"}


class EmployerOfficeController(EmployerController):
    @view_config(route_name='employer_offices', **GET)
    def list(self):
        return self.employer.offices

    @view_config(route_name='employer_offices', **POST)
    def create(self):
        return add_employer_office(self.employer, self.request.json)

    @view_config(route_name='employer_offices', **PUT)
    def set(self):
        return set_employer_offices(self.employer, self.request.json)

    @reify
    def office(self):
        id = self.request.matchdict["office_id"]
        office = DBSession.query(Office).get(id)
        if not office:
            raise HTTPNotFound("Unknown Office ID.")
        return office

    @view_config(route_name='employer_office', **GET)
    def get(self):
        return self.office

    @view_config(route_name='employer_office', **PUT)
    def edit(self):
        return update(self.office, self.request.json, EMPLOYER_OFFICE)

    @view_config(route_name='employer_office', **DELETE)
    def delete(self):
        office = self.office
        if office.type.name == 'HQ':
            raise HTTPBadRequest("Cannot Delete HQ")
        DBSession.delete(office)
        return {"status": "success"}


class EmployerOfferController(EmployerController):
    @reify
    def offer(self):
        offer_id = self.request.matchdict["offer_id"]
        offer = DBSession.query(EmployerOffer).get(offer_id)
        if not offer:
            raise HTTPNotFound("Unknown Candidate ID")
        elif offer.employer_id != self.employer.id:
            raise HTTPForbidden("Offer not for this employer.")
        return offer

    @view_config(route_name='employer_offer_newsfeed', **GET)
    @view_config(route_name='employer_offer_timeline', **GET)
    def offer_newsfeed(self):
        offer_id = self.request.matchdict["offer_id"]
        offer = DBSession.query(EmployerOffer).get(offer_id)
        if not offer:
            raise HTTPNotFound("Unknown Offer ID")
        elif offer.employer_id != self.employer.id:
            raise HTTPForbidden("Offer not for this employer.")
        timeline = get_offer_newsfeed(offer, candidate=offer.candidate)
        return timeline

    @view_config(route_name='employer_offers', **GET)
    def list(self):
        offers = DBSession.query(EmployerOffer).filter(EmployerOffer.employer_id == self.employer.id) \
            .options(joinedload_all('candidate.skills.skill'),
                     joinedload_all('candidate.skills.level')).all()
        return offers

    @view_config(route_name='employer_offers', **POST)
    def create(self):
        offer = add_employer_offer(self.employer, self.request.json)
        self.request.emailer.send_candidate_received_offer(
            offer.candidate.lang,
            offer.candidate.email,
            offer.message,
            offer.candidate.first_name,
            self.employer.company_name,
            offer.id
        )
        return offer

    @view_config(route_name='employer_offer', **GET)
    def get(self):
        return self.offer

    @view_config(route_name='employer_offer', **DELETE)
    def delete(self):
        DBSession.delete(self.offer)
        return {"status": "success"}

    # ================== OFFER STATUS ===============

    @view_config(route_name='employer_offer_signed', **POST)
    def contract_signed(self):
        try:
            offer = set_offer_signed(self.offer, self.offer.candidate, self.employer,
                                     self.request.json, self.request.emailer)
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return offer.full_status_flow

    @view_config(route_name='employer_offer_withdraw', **POST)
    def withdraw(self):
        offer = self.offer
        reason = get_by_name_or_raise(WithdrawalReason, self.request.json['reason'])
        try:
            offer.set_withdrawn(reason, self.request.json.get('withdrawal_text'))
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return offer.full_status_flow

    @view_config(route_name='employer_offer_status', **POST)
    def set_status(self):
        try:
            self.offer.set_status(self.request.json['status'])
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        return self.offer.full_status_flow

    @view_config(route_name='employer_offer_status', **GET)
    def get_status(self):
        return self.offer.full_status_flow


class EmployerPasswordController(RootController):
    def send_email(self, employer):
        self.request.emailer.send_employer_pwdforgot(employer.lang, employer.email, employer.contact_name,
                                                     employer.company_name, employer.pwdforgot_token)

    @view_config(route_name='employer_requestpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def requestpassword(self):
        email = self.request.json['email']
        resend = bool(self.request.json.get('resend'))
        return requestpassword(Employer, email, resend, self.send_email)


    @view_config(route_name='employer_resetpassword', permission=NO_PERMISSION_REQUIRED, **GET)
    def validatepassword(self):
        token = self.request.matchdict['token']
        return validatepassword(Employer, token)

    @view_config(route_name='employer_resetpassword', permission=NO_PERMISSION_REQUIRED, **POST)
    def resetpassword(self):
        token = self.request.matchdict['token']
        pwd = self.request.json['pwd']
        return resetpassword(Employer, token, pwd)


class EmployerDashboardController(EmployerController):
    @view_config(route_name='employer_newsfeed', **GET)
    def get_newsfeed(self):
        employer = self.employer
        results = get_employer_newsfeed(employer)
        return results

    @view_config(route_name='employer_interested_candidates', **GET)
    def employer_interested_candidates(self):
        return self.employer.interested_candidates

    @view_config(route_name='employer_relevant_candidates', **GET)
    def employer_relevant_candidates(self):
        if self.employer.status not in [APPLIED, APPROVED]:
            raise HTTPForbidden("Employer has not applied yet and is not approved")

        candidate_ids = get_employer_suggested_candidate_ids(self.employer.id)
        candidates = DBSession.query(WXPCandidate).options(joinedload("languages"), joinedload("skills"),
                                                           joinedload("work_experience")) \
            .filter(WXPCandidate.id.in_(candidate_ids)).all()
        return candidates

    @view_config(route_name='employer_suggested_candidates', **GET)
    def employer_suggested_candidates(self):
        if self.employer.status not in [APPLIED, APPROVED]:
            raise HTTPForbidden("Employer has not applied yet and is not approved")
        query = DBSession.query(SuggestedCandidate).filter(SuggestedCandidate.employer_id == self.employer.id,
                                                           SuggestedCandidate.employer_not_interested == None)
        return run_paginated_query(self.request, query)

    @view_config(route_name='employer_suggested_candidates', **DELETE)
    def not_interested_employer_suggested_candidates(self):
        if self.employer.status not in [APPLIED, APPROVED]:
            raise HTTPForbidden("Employer has not applied yet and is not approved")
        candidate_id = self.request.json['id']
        suggestion = DBSession.query(SuggestedCandidate).get((self.employer.id, candidate_id))
        if suggestion:
            suggestion.employer_not_interested = datetime.now()
        return {'success': True}
