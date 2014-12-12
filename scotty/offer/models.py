from datetime import datetime, timedelta
from uuid import uuid4
from pyramid.decorator import reify
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Table, Text, UniqueConstraint, and_, String, Sequence, \
    func, or_

from scotty.models.tools import json_encoder, PUBLIC
from scotty.configuration.models import City, Role, Benefit, Skill, RejectionReason, WithdrawalReason
from scotty.models.meta import Base, GUID
from sqlalchemy.orm import relationship, class_mapper
from sqlalchemy.sql.functions import now


class OfferStatus(object):
    def __init__(self, key, is_final, col_name=None):
        self.key = key
        self.is_final = is_final
        self.col_name = col_name

    def __str__(self): return self.key
    def __repr__(self): return self.key
    def __json__(self, request): return self.key


class InvalidStatusError(Exception):
    pass


# after this many days, the offer cannot be acted on anymore
STATUS_EXPIRATION_DAYS = 90


OFFER_STATUS_ACTIVE_KEY = 'ACTIVE'
OFFER_STATUS_ACCEPTED_KEY = 'ACCEPTED'
OFFER_STATUS_INTERVIEW_KEY = 'INTERVIEW'
OFFER_STATUS_CONTRACT_NEGOTIATION_KEY = 'CONTRACT_NEGOTIATION'
OFFER_STATUS_CONTRACT_SIGNED_KEY = 'CONTRACT_SIGNED'
OFFER_STATUS_REJECTED_KEY = 'REJECTED'
OFFER_STATUS_WITHDRAWN_KEY = 'WITHDRAWN'
OFFER_STATUS_EXPIRED_KEY = 'EXPIRED'


class OfferStatusWorkflow(object):

    statuses = [OfferStatus(OFFER_STATUS_ACTIVE_KEY, False, 'created'),
                OfferStatus(OFFER_STATUS_ACCEPTED_KEY, False, 'accepted'),
                OfferStatus(OFFER_STATUS_INTERVIEW_KEY, False, 'interview'),
                OfferStatus(OFFER_STATUS_CONTRACT_NEGOTIATION_KEY, False, 'contract_negotiation'),
                OfferStatus(OFFER_STATUS_CONTRACT_SIGNED_KEY, True, 'contract_signed'),
                OfferStatus(OFFER_STATUS_REJECTED_KEY, True, 'rejected'),
                OfferStatus(OFFER_STATUS_WITHDRAWN_KEY, True, 'withdrawn')]

    expired = OfferStatus(OFFER_STATUS_EXPIRED_KEY, True)

    status_keys = [os.key for os in statuses] + [expired.key]

    @property
    def _status_time(self):
        for status in self.statuses[::-1]:
            if getattr(self, status.col_name) is not None:
                return status, getattr(self, status.col_name)

    @reify
    def last_updated(self):
        return self._status_time[1]

    @property
    def status(self):
        status, status_time = self._status_time
        expiry_cutoff = datetime.now() - timedelta(STATUS_EXPIRATION_DAYS)
        if status.is_final or status_time > expiry_cutoff:
            return status
        else:
            return self.expired

    @property
    def full_status_flow(self):
        return [{'status': k.key, 'timestamp': getattr(self, k.col_name, None), 'is_final': k.is_final,
                 'completed': bool(getattr(self, k.col_name, None))} for k in self.statuses]

    @classmethod
    def order_by(cls, status_key):
        if status_key not in cls.status_keys:
            raise InvalidStatusError("%s not in %s" % (status_key, cls.status_keys))
        if status_key == cls.expired.key:
            raise InvalidStatusError("Cannot query expired.")
        status = [s for s in cls.statuses if s.key == status_key][0]
        columns = class_mapper(cls).columns
        return columns[status.col_name].desc()

    @classmethod
    def by_status(cls, status_key):
        columns = class_mapper(cls).columns
        expiry_cutoff = datetime.now() - timedelta(STATUS_EXPIRATION_DAYS)
        filter = []

        if status_key not in cls.status_keys:
            raise InvalidStatusError("%s not in %s" % (status_key, cls.status_keys))

        for status in cls.statuses[::-1]:
            if status_key != status.key:
                filter.append(columns[status.col_name].is_(None))
            else:
                filter.append(columns[status.col_name] >= expiry_cutoff)
                break
        return and_(*filter)

    @classmethod
    def has_accepted(cls):
        columns = class_mapper(cls).columns
        return columns['accepted'].isnot(None)

    @classmethod
    def by_active(cls):
        columns = class_mapper(cls).columns
        filter = []
        expiry_cols = []
        success_state = None

        for status in cls.statuses[::-1]:
            if status.key == OFFER_STATUS_CONTRACT_SIGNED_KEY:
                success_state = columns[status.col_name].isnot(None)
            elif status.is_final:
                filter.append(columns[status.col_name].is_(None))
            else:
                expiry_cols.append(columns[status.col_name])

        # make sure not expired only
        expiry_cutoff = datetime.now() - timedelta(STATUS_EXPIRATION_DAYS)
        # when hired, it cant expire, and should be returned in any case
        return or_(success_state, and_(func.coalesce(*expiry_cols) > expiry_cutoff, *filter))

    def accept(self, email, phone=None):
        if self.status == self.statuses[0]:
            self.accepted = datetime.now()
            self.email = email
            self.phone = phone
        else:
            raise InvalidStatusError("Offer cannot be set to ACCEPTED, it is in state: %s." % self.status)

    def set_contract_signed(self, start_date, start_salary):
        if self.status.is_final:
            raise InvalidStatusError("Status cannot be set to CONTRACT_SIGNED, "
                                     "this offer is already finalised in %s." % self.status)
        else:
            self.contract_signed = datetime.now()
            self.job_start_date = start_date
            self.job_start_salary = start_salary

    def set_withdrawn(self, reason, withdrawal_text=None):
        if self.status.is_final:
            raise InvalidStatusError("Status cannot be set to WITHDRAWN "
                                     "this offer is already finalised in %s." % self.status)
        else:
            self.withdrawn = datetime.now()
            self.withdrawal_reason = reason
            self.withdrawal_text = withdrawal_text

    def set_rejected(self, reason, rejected_text=None):
        if self.status.is_final:
            raise InvalidStatusError("Status cannot be set to REJECTED, "
                                     "this offer is already finalised in %s." % self.status)
        else:
            self.rejected = datetime.now()
            self.rejected_reason = reason
            self.rejected_text = rejected_text

    def set_status(self, status_key):
        columns = class_mapper(self.__class__).columns
        key = None
        for k in self.statuses:
            if getattr(self, k.col_name) is None:
                key = k
                break
            elif k.key == status_key:
                raise InvalidStatusError("Status %s already set." % status_key)
        if key and key.key == status_key:
            setattr(self, key.col_name, datetime.now())
        elif key:
            raise InvalidStatusError("Status %s cant be set, since %s has not been set yet." % (status_key, key.key))
        else:
            raise InvalidStatusError("Status %s cant be set." % status_key)

    def rollback(self):
        status = self.status
        if status.key == OFFER_STATUS_EXPIRED_KEY:
            raise InvalidStatusError("Offer is expired.")
        elif status.key == OFFER_STATUS_ACTIVE_KEY:
            raise InvalidStatusError("Offer is active, there is no previous state.")
        elif status.key == OFFER_STATUS_REJECTED_KEY:
            self.rejected = None
            self.rejected_reason = None
            self.rejected_text = None
        elif status.key == OFFER_STATUS_WITHDRAWN_KEY:
            self.withdrawn = None
            self.withdrawal_reason = None
            self.withdrawal_text = None
        elif status.key == OFFER_STATUS_CONTRACT_SIGNED_KEY:
            self.contract_signed = None
            self.job_start_date = None
            self.job_start_salary = None
        else:
            setattr(self, status.col_name, None)


offer_skills = Table('offer_skill', Base.metadata, Column('offer_id', GUID, ForeignKey('offer.id'), primary_key=True),
                     Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))


offer_benefits = Table('offer_benefit', Base.metadata,
                       Column('offer_id', GUID, ForeignKey('offer.id'), primary_key=True),
                       Column('benefit_id', Integer, ForeignKey('benefit.id'), primary_key=True))


class Offer(Base, OfferStatusWorkflow):
    __tablename__ = 'offer'
    __table_args__ = (UniqueConstraint('candidate_id', 'employer_id', 'annual_salary', 'location_id',
                                       name='_candidate_employer_offer_unique'),)

    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    reference = Column(Integer, Sequence("offer_reference_seq", start=7021), nullable=False, unique=True, info=PUBLIC)

    created = Column(DateTime, nullable=False, default=datetime.now, info=PUBLIC)
    accepted = Column(DateTime)
    email = Column(String(1024), info=PUBLIC)
    phone = Column(String(128), info=PUBLIC)

    rejected = Column(DateTime)
    withdrawn = Column(DateTime)

    interview = Column(DateTime)
    contract_negotiation = Column(DateTime)

    contract_signed = Column(DateTime)
    job_start_date = Column(DateTime, info=PUBLIC)
    job_start_salary = Column(Integer, info=PUBLIC)

    rejected_reason_id = Column(Integer, ForeignKey("rejectionreason.id"))
    rejected_reason = relationship(RejectionReason, info=PUBLIC)
    rejected_text = Column(Text, info=PUBLIC)

    withdrawal_reason_id = Column(Integer, ForeignKey("withdrawalreason.id"))
    withdrawal_reason = relationship(WithdrawalReason, info=PUBLIC)
    withdrawal_text = Column(Text, info=PUBLIC)

    candidate_id = Column(GUID, ForeignKey('candidate.id'), nullable=False)
    employer_id = Column(GUID, ForeignKey('employer.id'), nullable=False)

    location_id = Column(Integer, ForeignKey(City.id))
    location = relationship(City, info=PUBLIC)
    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    role = relationship(Role, info=PUBLIC)
    annual_salary = Column(Integer, nullable=False, info=PUBLIC)
    message = Column(Text, nullable=False, info=PUBLIC)

    interview_details = Column(Text, info=PUBLIC)
    job_description = Column(Text, info=PUBLIC)

    benefits = relationship(Benefit, secondary=offer_benefits, info=PUBLIC)
    technologies = relationship(Skill, secondary=offer_skills, info=PUBLIC)

    def __json__(self, request):
        result = json_encoder(self, request)
        result['status'] = self.status
        result['last_updated'] = self.last_updated
        result['technologies'] = self.technologies
        result['benefits'] = self.benefits
        result['role'] = self.role
        result['location'] = self.location
        result['rejected_reason'] = self.rejected_reason
        result['withdrawal_reason'] = self.withdrawal_reason
        return result


class EmployerOffer(Offer):
    candidate = relationship("EmbeddedCandidate")
    def __json__(self, request):
        results = super(EmployerOffer, self).__json__(request)
        results['candidate'] = self.candidate
        return results


class CandidateOffer(Offer):
    employer = relationship("EmbeddedEmployer")
    def __json__(self, request):
        results = super(CandidateOffer, self).__json__(request)
        results['employer'] = self.employer
        return results

class AnonymisedCandidateOffer(Offer):
    employer = relationship("EmbeddedEmployer")
    def __json__(self, request):
        results = json_encoder(self, request)
        results['status'] = self.status
        results['last_updated'] = self.last_updated
        results['role'] = self.role

        if request.employer_id == self.employer.id:
            results['employer'] = self.employer
        else:
            results['employer'] = {"company_name": "Company"}

        results['rejected_reason'] = self.rejected_reason
        results['withdrawal_reason'] = self.withdrawal_reason
        return results


class FullOffer(Offer):
    employer = relationship("EmbeddedEmployer")
    candidate = relationship("EmbeddedCandidate")

    def __json__(self, request):
        results = super(FullOffer, self).__json__(request)
        results['employer'] = self.employer
        results['candidate'] = self.candidate
        return results


class NewsfeedOffer(Offer):
    employer = relationship("EmbeddedEmployer")
    candidate = relationship("EmbeddedCandidate")

    def __json__(self, request):
        results = json_encoder(self, request)
        results['status'] = self.status
        results['last_updated'] = self.last_updated
        results['role'] = self.role
        results['employer'] = self.employer
        results['candidate'] = self.candidate
        results['rejected_reason'] = self.rejected_reason
        results['withdrawal_reason'] = self.withdrawal_reason
        return results







