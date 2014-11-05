from datetime import datetime
from sqlalchemy import or_, func

from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPForbidden, HTTPBadRequest, HTTPConflict
from pyramid.view import view_config
from scotty import DBSession
from scotty.configuration.models import CompanyType, WithdrawalReason
from scotty.employer.models import Employer, Office, APPLIED, APPROVED, EmployerOffer, FullEmployer
from scotty.candidate.models import WXPCandidate
from scotty.employer.services import employer_from_signup, employer_from_login, add_employer_office, \
    update_employer, get_employer_suggested_candidate_ids, add_employer_offer, get_employers_pager
from scotty.models.common import get_location_by_name_or_raise, get_or_raise_named_collection, get_by_name_or_raise
from scotty.offer.models import InvalidStatusError
from scotty.offer.services import set_offer_signed, get_offer_timeline
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
    config.add_route('employer_interestedcandidates', '{employer_id}/interestedcandidates')
    config.add_route('employer_suggested_candidates', '{employer_id}/suggestedcandidates')
    config.add_route('employer_signup_stage', '{employer_id}/signup_stage')
    config.add_route('employer_apply', '{employer_id}/apply')
    config.add_route('employer_offices', '{employer_id}/offices')
    config.add_route('employer_office', '{employer_id}/offices/{office_id}')

    config.add_route('employer_offers', '{employer_id}/offers')
    config.add_route('employer_offer', '{employer_id}/offers/{offer_id}')

    config.add_route('employer_offer_signed', '{employer_id}/offers/{offer_id}/signed')
    config.add_route('employer_offer_withdraw', '{employer_id}/offers/{offer_id}/withdraw')
    config.add_route('employer_offer_status', '{employer_id}/offers/{offer_id}/status')
    config.add_route('employer_offer_timeline', '{employer_id}/offers/{offer_id}/timeline')
    config.scan()


class EmployerInviteController(RootController):

    @reify
    def invited_employer(self):
        token = self.request.matchdict['token']
        employer = DBSession.query(FullEmployer).filter(FullEmployer.invite_token == token).first()
        if not employer:
            raise HTTPNotFound("Unknown Invite Token: %s" % token)
        return employer

    @view_config(route_name='employers_invite', **GET)
    def validate_invite(self):
        return self.invited_employer

    @view_config(route_name='employers_invite', **POST)
    def respond_invite(self):
        employer = self.invited_employer
        employer.password = self.request.json['pwd']
        self.request.session['employer_id'] = employer.id
        return employer


class EmployerController(RootController):

    @reify
    def employer(self):
        employer_id = self.request.matchdict["employer_id"]
        cls = FullEmployer
        if employer_id == 'me':
            employer_id = self.request.session.get('employer_id')
            if not employer_id:
                raise HTTPForbidden("Not logged in.")
        employer = DBSession.query(cls).get(employer_id)
        if not employer:
            raise HTTPNotFound("Unknown Employer ID")
        return employer

    @view_config(route_name='employers', **POST)
    def signup(self):
        try:
            employer = employer_from_signup(self.request.json)
            DBSession.add(employer)
            DBSession.flush()
        except IntegrityError, e:
            raise HTTPConflict("company_name or email already registered.")
        self.request.session['employer_id'] = employer.id
        return employer

    @view_config(route_name='employers', **GET)
    def search(self):
        params = self.request.params
        tags = filter(None, params.get('tags', '').split(','))
        city_id = None
        if 'country_iso' in params and 'city' in params:
            city_id = get_location_by_name_or_raise(params).id
        company_type_names = filter(None, params.get('company_type', '').split(','))
        company_types = get_or_raise_named_collection(CompanyType, company_type_names).values()

        def adjust_query(query, q=None):
            if q:
                query = query.filter(
                    or_(func.lower(Employer.contact_first_name).startswith(q),
                        func.lower(Employer.contact_last_name).startswith(q),
                        func.lower(Employer.email).startswith(q))
                )
            return query.options(joinedload('contact_salutation'),
                                 joinedload_all('offices.address_city'),
                                 joinedload('benefits'),
                                 joinedload('tech_tags'),
                                 joinedload('company_type'))

        if tags:
            pager = get_employers_pager(tags, city_id, company_types)
            result = ObjectBuilder(Employer).serialize(pager, adjust_query=adjust_query)
        else:
            basequery = adjust_query(DBSession.query(Employer))
            result = run_paginated_query(self.request, basequery)
        return result

    @view_config(route_name='employer_interestedcandidates', **GET)
    def employer_interestedcandidates(self):
        return self.employer.interested_candidates

    @view_config(route_name='employer_signup_stage', **GET)
    def signup_stage(self):
        employer = self.employer
        workflow = {'status': employer.status, 'ordering': ['step1', 'step2', 'step3', 'step4', 'step5'],
                    'step1': employer.logo_url is not None, 'step2': employer.mission_text is not None,
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
        if not self.request.json['agreedTos']:
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

        candidate_ids = get_employer_suggested_candidate_ids(self.employer.id)
        candidates = DBSession.query(WXPCandidate).options(joinedload("languages"), joinedload("skills"),
                                                           joinedload("work_experience")) \
            .filter(WXPCandidate.id.in_(candidate_ids)).all()
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
        self.request.session.invalidate()
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
        elif office.type.name == 'HQ':
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

    @view_config(route_name='employer_offer_timeline', **GET)
    def offer_timeline(self):
        offer_id = self.request.matchdict["offer_id"]
        offer = DBSession.query(EmployerOffer).get(offer_id)
        if not offer:
            raise HTTPNotFound("Unknown Offer ID")
        elif offer.employer_id != self.employer.id:
            raise HTTPForbidden("Offer not for this employer.")
        timeline = get_offer_timeline(offer)
        return timeline

    @view_config(route_name='employer_offers', **GET)
    def list(self):
        return self.employer.offers

    @view_config(route_name='employer_offers', **POST)
    def create(self):
        offer = add_employer_offer(self.employer, self.request.json)
        self.request.emailer.send_candidate_received_offer(
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
            offer = set_offer_signed(self.offer, self.request.json, self.request.emailer)
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
        self.request.emailer.send_employer_pwdforgot(employer.email, employer.contact_name,
                                                     employer.company_name, employer.pwdforgot_token)

    @view_config(route_name='employer_requestpassword', **POST)
    def requestpassword(self):
        email = self.request.json['email']
        resend = bool(self.request.json.get('resend'))
        return requestpassword(Employer, email, resend, self.send_email)


    @view_config(route_name='employer_resetpassword', **GET)
    def validatepassword(self):
        token = self.request.matchdict['token']
        return validatepassword(Employer, token)

    @view_config(route_name='employer_resetpassword', **POST)
    def resetpassword(self):
        token = self.request.matchdict['token']
        pwd = self.request.json['pwd']
        return resetpassword(Employer, token, pwd)



