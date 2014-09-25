from datetime import datetime, timedelta
from uuid import uuid4

from scotty.models.tools import json_encoder, PUBLIC
from scotty.configuration.models import City, Role, Benefit, Skill, RejectionReason
from scotty.models.meta import Base, GUID
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Table, Text, UniqueConstraint, and_
from sqlalchemy.orm import relationship, class_mapper


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


class OfferStatusWorkflow(object):
    expiration_days = 14

    statuses = [OfferStatus('ACTIVE', False, 'created'),
                OfferStatus('ACCEPTED', False, 'accepted'),
                OfferStatus('INTERVIEW', False, 'interview'),
                OfferStatus('CONTRACT_SENT', False, 'contract_sent'),
                OfferStatus('CONTRACT_RECEIVED', False, 'contract_received'),
                OfferStatus('CONTRACT_SIGNED', False, 'contract_signed'),
                OfferStatus('JOB_STARTED', True, 'job_started'),
                OfferStatus('REJECTED', True, 'rejected')]

    expired = OfferStatus('EXPIRED', True)

    status_keys = [os.key for os in statuses] + [expired.key]

    @property
    def _status_time(self):
        for status in self.statuses[::-1]:
            if getattr(self, status.col_name) is not None:
                return status, getattr(self, status.col_name)

    @property
    def status(self):
        status, status_time = self._status_time
        expiry_cutoff = datetime.now() - timedelta(self.expiration_days)
        if status_time < expiry_cutoff:
            return self.expired
        else:
            return status

    @property
    def full_status_flow(self):
        return [{'status': k.key, 'timestamp': getattr(self, k.col_name, None),
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
        expiry_cutoff = datetime.now() - timedelta(cls.expiration_days)
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

    def accept(self):
        if self.status == self.statuses[0]:
            self.accepted = datetime.now()
        else:
            raise InvalidStatusError("Offer cant be accepted, it is in state: %s." % self.status)

    def reject(self, reason):
        if self.status != self.statuses[-1]:
            self.rejected = datetime.now()
            self.rejected_reason = reason
        else:
            raise InvalidStatusError("Offer already rejected")

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

    created = Column(DateTime, nullable=False, default=datetime.now, info=PUBLIC)
    accepted = Column(DateTime)
    interview = Column(DateTime)
    contract_sent = Column(DateTime)
    contract_received = Column(DateTime)
    contract_signed = Column(DateTime)
    job_started = Column(DateTime)
    rejected = Column(DateTime)

    rejected_reason_id = Column(Integer, ForeignKey("rejectionreason.id"))
    rejected_reason = relationship(RejectionReason, info=PUBLIC)

    candidate_id = Column(GUID, ForeignKey('candidate.id'), nullable=False)
    employer_id = Column(GUID, ForeignKey('employer.id'), nullable=False)

    location_id = Column(Integer, ForeignKey(City.id))
    location = relationship(City, info=PUBLIC)
    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    role = relationship(Role, info=PUBLIC)
    annual_salary = Column(Integer, nullable=False, info=PUBLIC)

    interview_details = Column(Text, info=PUBLIC)
    job_description = Column(Text, info=PUBLIC)

    benefits = relationship(Benefit, secondary=offer_benefits, info=PUBLIC)
    technologies = relationship(Skill, secondary=offer_skills, info=PUBLIC)

    def __json__(self, request):
        result = json_encoder(self, request)
        result['status'] = self.status
        result['technologies'] = self.technologies
        result['benefits'] = self.benefits
        result['role'] = self.role
        result['location'] = self.location
        result['rejected_reason'] = self.rejected_reason
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


class FullOffer(Offer):
    employer = relationship("EmbeddedEmployer")
    candidate = relationship("EmbeddedCandidate")

    def __json__(self, request):
        results = super(FullOffer, self).__json__(request)
        results['employer'] = self.employer
        results['candidate'] = self.candidate
        return results

