from datetime import datetime
from pyramid.decorator import reify

from pyramid.httpexceptions import HTTPNotFound, HTTPConflict, HTTPBadRequest

from pyramid.view import view_config
from sqlalchemy.sql.elements import and_
from scotty.candidate.services import get_candidates_by_techtags_pager
from scotty.configuration.models import WithdrawalReason, RejectionReason
from scotty.models.common import get_by_name_or_raise
from scotty.models.meta import DBSession
from scotty.models.tools import json_encoder
from scotty.candidate.models import Candidate, InviteCode, CandidateStatus
from scotty.employer.models import Employer
from scotty.models import FullEmployer
from scotty.admin.services import invite_employer
from scotty.offer.models import FullOffer, InvalidStatusError
from scotty.offer.services import set_offer_signed
from scotty.services.pagingservice import ObjectBuilder
from scotty.views import RootController
from scotty.views.common import POST, run_paginated_query, GET, DELETE
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload_all, joinedload


def includeme(config):
    config.add_route('admin_search_employer', 'search/employers')
    config.add_route('admin_search_candidates', 'search/candidates')

    config.add_route('admin_employer', 'employers')
    config.add_route('admin_employer_by_status', 'employers/{status}')
    config.add_route('admin_employer_approve', 'employers/{employer_id}/approve')

    config.add_route('admin_invite_codes', 'invite_codes')

    config.add_route('admin_offers', 'offers')
    config.add_route('admin_offer', 'offers/{id}')
    config.add_route('admin_offer_accept', 'offers/{id}/accept')
    config.add_route('admin_offer_reject', 'offers/{id}/reject')
    config.add_route('admin_offer_status', 'offers/{id}/status')
    config.add_route('admin_offer_signed', 'offers/{id}/signed')
    config.add_route('admin_offer_withdraw', 'offers/{id}/withdraw')
    config.add_route('admin_offer_rollback', 'offers/{id}/rollback')
    config.scan()


class SearchResultCandidate(Candidate):
    def __json__(self, request):
        result = super(SearchResultCandidate, self).__json__(request)
        result['email'] = self.email
        return result


class SearchResultEmployer(Employer):
    def __json__(self, request):
        result = json_encoder(self, request)
        result['contact_salutation'] = self.contact_salutation
        result['company_type'] = self.company_type
        result['status'] = self.status
        result['email'] = self.email
        return result


class AdminInviteCodeController(RootController):
    @view_config(route_name='admin_invite_codes', **GET)
    def list(self):
        cstatus = get_by_name_or_raise(CandidateStatus,
                                       self.request.params.get('candidate_status', CandidateStatus.ACTIVE))
        candidate_count = func.count(Candidate.id).label("candidate_count")
        last_used = func.max(Candidate.created).label("last_used")
        codes_query = DBSession.query(InviteCode.code, InviteCode.description, InviteCode.created, candidate_count,
                                      last_used).outerjoin(Candidate, and_(Candidate.invite_code_id == InviteCode.id,
                                                                           Candidate.status_id == cstatus.id)).group_by(
            InviteCode.code, InviteCode.description, InviteCode.created)

        def serializer(result):
            return [r._asdict() for r in result]

        return run_paginated_query(self.request, codes_query, serializer=serializer)

    @view_config(route_name='admin_invite_codes', **POST)
    def create(self):
        code = self.request.json.get('code')
        if not code:
            raise HTTPBadRequest("Code required.")
        icode = InviteCode(code=code, description=self.request.json.get('description'))
        DBSession.add(icode)
        try:
            DBSession.flush()
        except IntegrityError:
            raise HTTPConflict("Code already created!")
        return icode


class AdminController(RootController):
    @view_config(route_name='admin_employer', **POST)
    def invite(self):
        try:
            employer = invite_employer(self.request.json)
        except IntegrityError:
            raise HTTPConflict("company_name of email already registered.")

        self.request.emailer.send_employer_invite(employer.email, employer.contact_name, employer.company_name, employer.invite_token)
        return employer

    @view_config(route_name='admin_employer_by_status', **GET)
    def admin_employer_by_status(self):
        status = self.request.matchdict['status']
        query = DBSession.query(FullEmployer).filter(*FullEmployer.by_status(status))

        searchterm = self.request.params.get('q')
        if searchterm is not None:
            query = query.filter(func.lower(FullEmployer.company_name).contains(func.lower(searchterm)))

        return run_paginated_query(self.request, query)

    @view_config(route_name='admin_employer_approve', **GET)
    def admin_employer_approve(self):
        employer_id = self.request.matchdict['employer_id']
        employer = DBSession.query(FullEmployer).get(employer_id)
        if not employer:
            raise HTTPNotFound("Unknown Employer ID")
        employer.approved = datetime.now()
        return employer

    @view_config(route_name="admin_search_candidates", **GET)
    def admin_search_candidates(self):
        params = self.request.params
        q = params.get('q')
        tags = filter(None, params.get('tags', '').split(','))

        def adjust_query(query, q=None):
            if q:
                q = q.lower()
                query = query.filter(
                    or_(func.lower(Candidate.first_name).startswith(q), func.lower(Candidate.last_name).startswith(q),
                        func.lower(Candidate.email).startswith(q)))
            return query.options(joinedload_all('languages.language'), joinedload_all('languages.proficiency'),
                                 joinedload_all('skills.skill'), joinedload_all('skills.level'),
                                 joinedload('preferred_locations'))

        if tags:
            pager = get_candidates_by_techtags_pager(tags, None)
            result = ObjectBuilder(SearchResultCandidate).serialize(pager, adjust_query=adjust_query)
        else:
            basequery = adjust_query(DBSession.query(SearchResultCandidate), q)
            result = run_paginated_query(self.request, basequery)
        return result

    @view_config(route_name="admin_search_employer", **GET)
    def admin_search_employer(self):
        q = self.request.params['q'].lower()
        base_query = DBSession.query(SearchResultEmployer).filter(
            or_(func.lower(Employer.company_name).startswith(q), func.lower(Employer.contact_first_name).startswith(q),
                func.lower(Employer.contact_last_name).startswith(q), func.lower(Employer.email).startswith(q)))
        return run_paginated_query(self.request, base_query)


class AdminOfferController(RootController):
    @reify
    def offer(self):
        guid = self.request.matchdict['id']
        offer = DBSession.query(FullOffer).get(guid)
        if not offer:
            raise HTTPNotFound("Offer not found")
        return offer

    @view_config(route_name='admin_offers', **GET)
    def admin_offers(self):
        query = DBSession.query(FullOffer).options(joinedload('technologies'), joinedload('role'),
                                                   joinedload('location'), joinedload('benefits'),
                                                   joinedload('rejected_reason'), joinedload('withdrawal_reason'),
                                                   joinedload('candidate'), joinedload('employer'))
        status = self.request.params.get('status')
        if status:
            try:
                query = query.filter(FullOffer.by_status(status)).order_by(FullOffer.order_by(status))
            except InvalidStatusError, e:
                raise HTTPBadRequest(e.message)
        else:
            query = query.order_by(FullOffer.created.desc())

        return run_paginated_query(self.request, query, default_limit=50)

    @view_config(route_name='admin_offer', **GET)
    def admin_offer(self):
        return self.offer

    @view_config(route_name='admin_offer_status', **POST)
    def admin_set_offer_status(self):
        try:
            self.offer.set_status(self.request.json['status'])
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_status', **GET)
    def admin_get_offer_status(self):
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_signed', **POST)
    def contract_signed(self):
        try:
            offer = set_offer_signed(self.offer, self.request.json, self.request.emailer)
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return offer.full_status_flow

    @view_config(route_name='admin_offer_withdraw', **POST)
    def withdraw(self):
        reason = get_by_name_or_raise(WithdrawalReason, self.request.json['reason'])
        try:
            self.offer.set_withdrawn(reason, self.request.json.get('withdrawal_text'))
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_accept', **POST)
    def accept(self):
        try:
            self.offer.accept(**self.request.json)
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_reject', **POST)
    def reject(self):
        reason = get_by_name_or_raise(RejectionReason, self.request.json['reason'])
        try:
            self.offer.set_rejected(reason, self.request.json.get('rejected_text'))
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_rollback', **POST)
    def rollback(self):
        try:
            self.offer.rollback()
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow