from datetime import datetime, timedelta
from uuid import uuid4
from pyramid.httpexceptions import HTTPBadRequest
from scotty.models.tools import json_encoder, PUBLIC
from scotty.models.configuration import City, Role, Benefit, Skill, RejectionReason
from scotty.models.meta import Base, GUID
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Table, Text, UniqueConstraint
from sqlalchemy.orm import relationship


offer_skills = Table('offer_skill', Base.metadata, Column('offer_id', GUID, ForeignKey('offer.id'), primary_key=True),
                     Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))

offer_benefits = Table('offer_benefit', Base.metadata,
                       Column('offer_id', GUID, ForeignKey('offer.id'), primary_key=True),
                       Column('benefit_id', Integer, ForeignKey('benefit.id'), primary_key=True))

OFFER_EXPIRY_DAYS = 14

ACTIVE = 'ACTIVE'
ACCEPTED = 'ACCEPTED'
REJECTED = 'REJECTED'
EXPIRED = 'EXPIRED'


class Offer(Base):
    __tablename__ = 'offer'
    __table_args__ = (UniqueConstraint('candidate_id', 'employer_id', 'annual_salary', 'location_id',
                                       name='_candidate_employer_offer_unique'),)

    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    created = Column(DateTime, nullable=False, default=datetime.now, info=PUBLIC)
    accepted = Column(DateTime)
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

    @property
    def status(self):
        if self.accepted is not None:
            return ACCEPTED
        elif self.rejected is not None:
            return REJECTED
        elif self.created > datetime.now() - timedelta(OFFER_EXPIRY_DAYS):
            return ACTIVE
        else:
            return EXPIRED

    def by_status(self, status):
        expiry_time = datetime.now() - timedelta(OFFER_EXPIRY_DAYS)
        STATUS = {
            ACCEPTED: [Offer.accepted != None],
            REJECTED: [Offer.rejected != None],
            ACTIVE: [Offer.accepted == None, Offer.rejected == None, Offer.created >= expiry_time],
            EXPIRED: [Offer.accepted == None, Offer.rejected == None, Offer.created < expiry_time]
        }

        if status not in STATUS:
            raise HTTPBadRequest("InvalidStatus Requested: %s is not one of %s" % (status, STATUS.keys()))
        else:
            return STATUS[status]

    def __json__(self, request):
        result = json_encoder(self, request)
        result['status'] = self.status
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

