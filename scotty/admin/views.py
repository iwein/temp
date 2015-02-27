from datetime import datetime

from pyramid.decorator import reify
from pyramid.httpexceptions import HTTPNotFound, HTTPConflict, HTTPBadRequest, HTTPFound
from pyramid.view import view_config
from scotty.auth.provider import ADMIN_PERM
from scotty.offer.services import set_offer_signed, OFFER_EDITABLES
from scotty.tools import split_strip
from sqlalchemy.sql.elements import and_
from scotty.configuration.models import WithdrawalReason, RejectionReason, Skill
from scotty.models.common import get_by_name_or_raise
from scotty.models.meta import DBSession
from scotty.models.tools import json_encoder, add_sorting, distinct_counter, update
from scotty.candidate.models import Candidate, InviteCode, CandidateStatus, CandidateSkill, CANDIDATE_SORTABLES, \
    SerializableBookmark
from scotty.employer.models import Employer, EMPLOYER_SORTABLES, CandidateSuggestedTo, SuggestedCandidate
from scotty.models import FullEmployer
from scotty.admin.services import invite_employer
from scotty.offer.models import FullOffer, InvalidStatusError
from scotty.views import RootController
from scotty.views.common import POST, run_paginated_query, GET, PUT, DELETE
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload_all, joinedload


def includeme(config):
    config.add_route('admin_search_employer', 'search/employers')
    config.add_route('admin_search_candidates', 'search/candidates')

    config.add_route('admin_sudo_employer', 'sudo/employer/:id')
    config.add_route('admin_sudo_candidate', 'sudo/candidate/:id')

    config.add_route('admin_employer', 'employers')
    config.add_route('admin_employer_by_status', 'employers/{status}')
    config.add_route('admin_employer_approve', 'employers/{employer_id}/approve')
    config.add_route('admin_candidate_approve', 'candidates/{candidate_id}/approve')
    config.add_route('admin_candidate_sleep', 'candidates/{candidate_id}/sleep')
    config.add_route('admin_candidate_wake', 'candidates/{candidate_id}/wake')

    config.add_route('admin_candidate_suggestions', 'candidates/{candidate_id}/suggested_to')

    config.add_route('admin_invite_codes', 'invite_codes')
    config.add_route('admin_invite_code', 'invite_codes/:code')
    config.add_route('admin_invite_code_candidates', 'invite_codes/:code/candidates')

    config.add_route('admin_offers', 'offers')
    config.add_route('admin_offer', 'offers/{id}')
    config.add_route('admin_offer_accept', 'offers/{id}/accept')
    config.add_route('admin_offer_reject', 'offers/{id}/reject')
    config.add_route('admin_offer_status', 'offers/{id}/status')
    config.add_route('admin_offer_signed', 'offers/{id}/signed')
    config.add_route('admin_offer_withdraw', 'offers/{id}/withdraw')
    config.add_route('admin_offer_rollback', 'offers/{id}/rollback')

    config.add_route('admin_offerrequests', 'offerrequests')

    config.scan()


class SearchResultCandidate(Candidate):
    def __json__(self, request):
        if request.params.get('fields'):
            fields = request.params.get('fields')
            return {k: getattr(self, k) for k in split_strip(fields)}
        else:
            result = super(SearchResultCandidate, self).__json__(request)
            result['email'] = self.email
            result['created'] = self.created
            return result


class SearchResultEmployer(Employer):
    def __json__(self, request):
        if request.params.get('fields'):
            fields = request.params.get('fields')
            return {k: getattr(self, k) for k in split_strip(fields)}
        else:
            result = json_encoder(self, request)
            result['contact_salutation'] = self.contact_salutation
            result['company_type'] = self.company_type
            result['offices'] = self.offices
            result['status'] = self.status
            result['email'] = self.email
            result['created'] = self.created
            return result


class AdminInviteCodeController(RootController):
    @view_config(route_name='admin_invite_codes', permission=ADMIN_PERM, **GET)
    def list(self):
        candidate_count = func.count(Candidate.id).label("candidate_count")
        last_used = func.max(Candidate.created).label("last_used")
        codes_query = DBSession.query(InviteCode.code, InviteCode.description, InviteCode.created, candidate_count,
                                      last_used).outerjoin(Candidate, and_(Candidate.invite_code_id == InviteCode.id)) \
            .group_by(InviteCode.code, InviteCode.description, InviteCode.created)

        def serializer(result):
            return [r._asdict() for r in result]

        return run_paginated_query(self.request, codes_query, serializer=serializer)

    @view_config(route_name='admin_invite_codes', permission=ADMIN_PERM, **POST)
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

    @view_config(route_name='admin_invite_code', permission=ADMIN_PERM, **GET)
    def get(self):
        code = self.request.matchdict['code']
        icode = DBSession.query(InviteCode).filter(InviteCode.code == code).first()
        if not icode:
            raise HTTPNotFound('Unknown code.')
        return icode

    @view_config(route_name='admin_invite_code_candidates', permission=ADMIN_PERM, **GET)
    def ic_candidates(self):
        code = self.request.matchdict['code']
        icode = DBSession.query(InviteCode).filter(InviteCode.code == code).first()
        if not icode:
            raise HTTPNotFound('Unknown code.')
        query = DBSession.query(Candidate).filter(Candidate.invite_code == icode)
        return run_paginated_query(self.request, query)


class AdminController(RootController):
    @view_config(route_name='admin_sudo_employer', permission=ADMIN_PERM, **GET)
    def sudo_employer(self):
        employer_id = self.request.matchdict['id']
        employer = DBSession.query(Employer).get(employer_id)
        if not employer:
            raise HTTPNotFound('Unknown employer id')
        else:
            self.request.session['employer_id'] = employer.id

        location = self.request.params.get('furl')
        if not location:
            location = 'http://%s/employer' % self.request.frontend_domain

        raise HTTPFound(location=location)

    @view_config(route_name='admin_sudo_candidate', permission=ADMIN_PERM, **GET)
    def sudo_candidate(self):
        candidate_id = self.request.matchdict['id']
        candidate = DBSession.query(Candidate).get(candidate_id)
        if not candidate:
            raise HTTPNotFound('Unknown candidate id')
        else:
            self.request.session['candidate_id'] = candidate.id

        location = self.request.params.get('furl')
        if not location:
            location = 'http://%s/candidate' % self.request.frontend_domain

        raise HTTPFound(location=location)

    @view_config(route_name='admin_employer', permission=ADMIN_PERM, **POST)
    def invite(self):
        try:
            employer = invite_employer(self.request.json)
        except IntegrityError:
            raise HTTPConflict("company_name of email already registered.")

        self.request.emailer.send_employer_invite(employer.lang, employer.email, employer.contact_name,
                                                  employer.company_name, employer.invite_token)
        return employer

    @view_config(route_name='admin_employer_by_status', permission=ADMIN_PERM, **GET)
    def admin_employer_by_status(self):
        status = self.request.matchdict['status']
        query = DBSession.query(FullEmployer).filter(*FullEmployer.by_status(status))

        searchterm = self.request.params.get('q')
        if searchterm is not None:
            query = query.filter(func.lower(FullEmployer.company_name).contains(func.lower(searchterm)))

        return run_paginated_query(self.request, query)

    @view_config(route_name='admin_employer_approve', permission=ADMIN_PERM, **GET)
    def admin_employer_approve(self):
        employer_id = self.request.matchdict['employer_id']
        employer = DBSession.query(FullEmployer).get(employer_id)
        if not employer:
            raise HTTPNotFound("Unknown Employer ID")
        employer.approved = datetime.now()
        self.request.emailer.send_employer_approved(employer.lang, employer)
        return employer

    @view_config(route_name='admin_candidate_approve', permission=ADMIN_PERM, **GET)
    @view_config(route_name='admin_candidate_wake', permission=ADMIN_PERM, **GET)
    def admin_candidate_approve(self):
        candidate_id = self.request.matchdict['candidate_id']
        candidate = DBSession.query(Candidate).get(candidate_id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        candidate.status = get_by_name_or_raise(CandidateStatus, CandidateStatus.ACTIVE)

        if self.request.matched_route.name == 'admin_candidate_approve':
            self.request.emailer.send_candidate_approved(candidate.lang, candidate)
        return candidate

    @view_config(route_name='admin_candidate_sleep', permission=ADMIN_PERM, **GET)
    def admin_candidate_sleep(self):
        candidate_id = self.request.matchdict['candidate_id']
        candidate = DBSession.query(Candidate).get(candidate_id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        candidate.status = get_by_name_or_raise(CandidateStatus, CandidateStatus.SLEEPING)
        return candidate

    @view_config(route_name="admin_search_candidates", permission=ADMIN_PERM, **GET)
    def admin_search_candidates(self):
        params = self.request.params
        status = params.get('status')
        order = params.get('order')
        q = params.get('q')
        tags = split_strip(params.get('tags'))

        basequery = DBSession.query(SearchResultCandidate) \
            .options(joinedload_all('languages.language'), joinedload_all('languages.proficiency'),
                     joinedload_all('skills.skill'), joinedload_all('skills.level'),
                     joinedload_all('target_position.preferred_locations'))
        if status:
            status = get_by_name_or_raise(CandidateStatus, status)
            basequery = basequery.filter(Candidate.status == status)
        if q:
            q = q.lower()
            basequery = basequery.filter(
                or_(func.lower(Candidate.first_name).startswith(q),
                    func.lower(Candidate.last_name).startswith(q),
                    func.lower(func.concat(Candidate.first_name, " ", Candidate.last_name)).startswith(q),
                    func.lower(Candidate.email).startswith(q)))
        if tags:
            basequery = basequery.outerjoin(CandidateSkill).join(Skill).filter(Skill.name.in_(tags))
        if order:
            basequery = add_sorting(basequery, order, CANDIDATE_SORTABLES)
        return run_paginated_query(self.request, basequery, counter=distinct_counter(SearchResultCandidate.id))

    @view_config(route_name="admin_search_employer", permission=ADMIN_PERM, **GET)
    def admin_search_employer(self):
        basequery = DBSession.query(SearchResultEmployer)
        status = self.request.params.get('status')
        order = self.request.params.get('order', 'name')

        if 'q' in self.request.params:
            q = self.request.params['q'].lower()
            basequery = DBSession.query(SearchResultEmployer).filter(
                or_(func.lower(Employer.company_name).startswith(q),
                    func.lower(Employer.contact_first_name).startswith(q),
                    func.lower(Employer.contact_last_name).startswith(q), func.lower(Employer.email).startswith(q)))
        if status:
            basequery = basequery.filter(*Employer.by_status(status))
        if order:
            basequery = add_sorting(basequery, order, EMPLOYER_SORTABLES)
        return run_paginated_query(self.request, basequery, counter=distinct_counter(SearchResultEmployer.id))


class AdminOfferController(RootController):
    @reify
    def offer(self):
        guid = self.request.matchdict['id']
        offer = DBSession.query(FullOffer).get(guid)
        if not offer:
            raise HTTPNotFound("Offer not found")
        return offer

    @view_config(route_name='admin_offers', permission=ADMIN_PERM, **GET)
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


    @view_config(route_name='admin_offerrequests', permission=ADMIN_PERM, **GET)
    def admin_offerrequests(self):
        query = DBSession.query(SerializableBookmark).order_by(SerializableBookmark.created.desc())
        return run_paginated_query(self.request, query, default_limit=20)


    @view_config(route_name='admin_offer', permission=ADMIN_PERM, **GET)
    def admin_offer(self):
        return self.offer

    @view_config(route_name='admin_offer', permission=ADMIN_PERM, **PUT)
    def edit_admin_offer(self):
        return update(self.offer, self.request.json, OFFER_EDITABLES)

    @view_config(route_name='admin_offer_status', **POST)
    def admin_set_offer_status(self):
        try:
            self.offer.set_status(self.request.json['status'])
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_status', permission=ADMIN_PERM, **GET)
    def admin_get_offer_status(self):
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_signed', permission=ADMIN_PERM, **POST)
    def contract_signed(self):
        try:
            offer = set_offer_signed(self.offer, self.offer.candidate, self.offer.employer,
                                     self.request.json, self.request.emailer)
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return offer.full_status_flow

    @view_config(route_name='admin_offer_withdraw', permission=ADMIN_PERM, **POST)
    def withdraw(self):
        reason = get_by_name_or_raise(WithdrawalReason, self.request.json['reason'])
        try:
            self.offer.set_withdrawn(reason, self.request.json.get('withdrawal_text'))
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_accept', permission=ADMIN_PERM, **POST)
    def accept(self):
        try:
            self.offer.accept(**self.request.json)
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_reject', permission=ADMIN_PERM, **POST)
    def reject(self):
        reason = get_by_name_or_raise(RejectionReason, self.request.json['reason'])
        try:
            self.offer.set_rejected(reason, self.request.json.get('rejected_text'))
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow

    @view_config(route_name='admin_offer_rollback', permission=ADMIN_PERM, **POST)
    def rollback(self):
        try:
            self.offer.rollback()
        except InvalidStatusError, e:
            raise HTTPBadRequest(e.message)
        DBSession.flush()
        return self.offer.full_status_flow


class AdminCandidateSuggestuinsController(RootController):

    @view_config(route_name='admin_candidate_suggestions', permission=ADMIN_PERM, **GET)
    def get_admin_candidate_suggestions(self):
        candidate_id = self.request.matchdict['candidate_id']
        query = DBSession.query(CandidateSuggestedTo).filter(CandidateSuggestedTo.candidate_id == candidate_id)
        return run_paginated_query(self.request, query)

    @view_config(route_name='admin_candidate_suggestions', permission=ADMIN_PERM, **POST)
    def create_admin_candidate_suggestions(self):
        employer = DBSession.query(Employer).get(self.request.json['id'])
        if not employer:
            raise HTTPBadRequest('Unknown Employer')

        candidate = DBSession.query(Candidate).get(self.request.matchdict['candidate_id'])
        if not candidate:
            raise HTTPNotFound('Unknown Candidate')

        sc = SuggestedCandidate(candidate_id=candidate.id, employer_id=employer.id)
        try:
            DBSession.add(sc)
            DBSession.flush()
        except IntegrityError, e:
            raise HTTPConflict("Employer already suggested to Candidate")

        self.request.emailer.send_employer_new_suggested_candidate(employer.lang,
                                                                   employer.email,
                                                                   employer.contact_name,
                                                                   employer.company_name,
                                                                   candidate_name=candidate.full_name,
                                                                   candidate_id=candidate.id)
        return sc

    @view_config(route_name='admin_candidate_suggestions', permission=ADMIN_PERM, **DELETE)
    def delete_admin_candidate_suggestions(self):
        employer_id = self.request.json['id']
        candidate_id = self.request.matchdict['candidate_id']
        query = DBSession.query(SuggestedCandidate)\
            .filter(SuggestedCandidate.candidate_id == candidate_id)\
            .filter(SuggestedCandidate.employer_id == employer_id).delete()
        return {'success': True}

