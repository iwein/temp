from datetime import datetime
from uuid import uuid4

from sqlalchemy.dialects.postgresql import JSON
from pyramid.httpexceptions import HTTPBadRequest
from scotty.auth.provider import CANDIDATE
from scotty.candidate.models import CandidateEmployerBlacklist, CandidateBookmarkEmployer
from scotty.models import get_by_name_or_raise
from scotty.services import hash_pwd
from sqlalchemy.ext.associationproxy import association_proxy
from scotty.configuration.models import City, TrafficSource, Skill, Benefit, Salutation, OfficeType, CompanyType, \
    Locale
from scotty.offer.models import EmployerOffer, Offer
from scotty.models.meta import Base, GUID, DBSession
from scotty.models.tools import PUBLIC, PRIVATE, json_encoder, JsonSerialisable, get_request_role, ADMIN
from sqlalchemy import Column, Text, String, Integer, ForeignKey, CheckConstraint, Boolean, Table, DateTime, BigInteger, \
    or_
from sqlalchemy.ext.orderinglist import ordering_list
from sqlalchemy.orm import relationship


employer_address_mapping = {'line1': 'address_line1', 'line2': 'address_line2', 'line3': 'address_line3',
                            'zipcode': 'address_zipcode'}

INVITED = 'INVITED'
SIGNEDUP = 'SIGNEDUP'
APPLIED = 'APPLIED'
APPROVED = 'APPROVED'
DELETED = 'DELETED'


class Office(Base):
    __tablename__ = 'employer_office'
    id = Column(Integer, primary_key=True, info=PUBLIC)
    employer_id = Column(GUID, ForeignKey('employer.id'), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)

    contact_salutation_id = Column(Integer, ForeignKey(Salutation.id))
    contact_salutation = relationship(Salutation)
    contact_first_name = Column(String(255), info=PUBLIC)
    contact_last_name = Column(String(255), info=PUBLIC)
    contact_phone = Column(String(32), info=PUBLIC)
    contact_email = Column(String(1024), nullable=False, info=PUBLIC)
    contact_position = Column(String(128), info=PUBLIC)

    website = Column(String(512), info=PUBLIC)
    address_line1 = Column(String(512), nullable=False, info=PUBLIC)
    address_line2 = Column(String(512), info=PUBLIC)
    address_line3 = Column(String(512), info=PUBLIC)
    address_zipcode = Column(String(20), nullable=False, info=PUBLIC)
    address_city_id = Column(Integer, ForeignKey(City.id), nullable=False)
    address_city = relationship(City)

    type_id = Column(Integer, ForeignKey(OfficeType.id), nullable=False, default=2)
    type = relationship(OfficeType)

    def __json__(self, request):
        result = json_encoder(self, request)
        result['address_city'] = self.address_city
        result['contact_salutation'] = self.contact_salutation
        result['type'] = self.type
        return result


employer_skills = Table('employer_skill', Base.metadata,
                        Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                        Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))

employer_benefits = Table('employer_benefit', Base.metadata,
                          Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                          Column('benefit_id', Integer, ForeignKey('benefit.id'), primary_key=True))


class SuggestedCandidate(Base):
    __tablename__ = 'suggested_candidates'
    employer_id = Column(GUID, ForeignKey('employer.id'), primary_key=True)
    employer = relationship('Employer', backref='candidate_suggestions')
    candidate_id = Column(GUID, ForeignKey('candidate.id'), primary_key=True)
    candidate = relationship('Candidate', backref='suggested_to')
    created = Column(DateTime(), nullable=False, default=datetime.now())
    last_sent = Column(DateTime())
    employer_not_interested = Column(DateTime())

    def __json__(self, request):
        return {'created': self.created, 'employer_not_interested': self.employer_not_interested,
                'candidate': self.candidate, 'last_sent': self.last_sent}


class CandidateSuggestedTo(SuggestedCandidate):
    def __json__(self, request):
        return {'created': self.created, 'employer_not_interested': self.employer_not_interested,
                'employer': self.employer, 'last_sent': self.last_sent}


class EmployerPicture(Base):
    __tablename__ = 'employer_picture'
    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    employer_id = Column(GUID, ForeignKey('employer.id'), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)
    description = Column(String(1024))
    url = Column(String(1024), nullable=False)
    position = Column(Integer(), nullable=False)

    def __json__(self, request):
        return {'url': self.url, 'description': self.description, 'created': self.created, 'id': self.id}


class EmployerSavedSearch(Base):
    __tablename__ = 'employer_savedsearch'
    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    employer_id = Column(GUID, ForeignKey('employer.id'), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)
    advanced = Column(Boolean)
    name = Column(String(512), info=PUBLIC)
    terms = Column(JSON)

    def __json__(self, request):
        return {
            'created': self.created,
            'id': self.id,
            'name': self.name,
            'terms': self.terms,
            'advanced': self.advanced
        }


class Employer(Base, JsonSerialisable):
    __tablename__ = 'employer'
    __name_field__ = 'company_name'
    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    company_name = Column(String(255), nullable=False, info=PUBLIC)
    pwdforgot_token = Column(GUID, unique=True, info=PRIVATE)
    pwdforgot_sent = Column(DateTime, info=PRIVATE)
    invite_token = Column(GUID, info=PRIVATE)
    invite_sent = Column(DateTime, info=PRIVATE)
    created = Column(DateTime, nullable=False, default=datetime.now, info=PRIVATE)
    last_login = Column(DateTime, info=PRIVATE)
    last_active = Column(DateTime, info=PRIVATE)
    agreedTos = Column(DateTime)
    approved = Column(DateTime)
    deleted = Column(DateTime)

    company_type_id = Column(Integer, ForeignKey(CompanyType.id), nullable=False, server_default='1')
    company_type = relationship(CompanyType)

    locale_id = Column(Integer, ForeignKey(Locale.id), nullable=False, server_default='1')
    locale = relationship(Locale)

    @property
    def lang(self):
        return self.locale.name

    email = Column(String(512), nullable=False, info=PRIVATE)
    pwd = Column(String(128))
    contact_salutation_id = Column(Integer, ForeignKey(Salutation.id))
    contact_salutation = relationship(Salutation)
    contact_first_name = Column(String(255), info=PUBLIC)
    contact_last_name = Column(String(255), info=PUBLIC)

    website = Column(String(512), info=PUBLIC)
    logo_url = Column(String(1024), info=PUBLIC)
    image_video_url = Column(String(1024), info=PUBLIC)
    fb_url = Column(String(1024), info=PUBLIC)
    linkedin_url = Column(String(1024), info=PUBLIC)

    mission_text = Column(Text, info=PUBLIC)
    culture_text = Column(Text, info=PUBLIC)
    vision_text = Column(Text, info=PUBLIC)
    recruitment_process = Column(Text, info=PUBLIC)
    training_policy = Column(Text, info=PUBLIC)

    founding_year = Column(Integer, info=PUBLIC)
    revenue_pa = Column(BigInteger, info=PUBLIC)
    funding_amount = Column(BigInteger, info=PUBLIC)
    funding_text = Column(Text, info=PUBLIC)

    no_of_employees = Column(Integer, info=PUBLIC)
    tech_team_size = Column(Integer, info=PUBLIC)
    tech_team_philosophy = Column(Text, info=PUBLIC)

    cto_blog = Column(Text, info=PUBLIC)
    cto_twitter = Column(Text, info=PUBLIC)
    tech_team_office = Column(Text, info=PUBLIC)
    working_env = Column(Text, info=PUBLIC)
    dev_methodology = Column(Text, info=PUBLIC)
    video_script = Column(Text, info=PUBLIC)

    tech_tags = relationship(Skill, secondary=employer_skills, info=PUBLIC)
    other_benefits = Column(Text, info=PUBLIC)
    benefits = relationship(Benefit, secondary=employer_benefits, info=PUBLIC)

    external_rating = Column(Integer, CheckConstraint('external_rating between 0 and 5'), info=PUBLIC)
    featured = Column(Boolean)

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource, info=PUBLIC)

    interested_candidates = association_proxy('candidate_bookmarks', 'candidate')
    suggested_candidates = association_proxy('candidate_suggestions', 'candidate')
    saved_searches = relationship(EmployerSavedSearch, backref='employer')

    offices = relationship(Office, backref='employer', cascade='all, delete, delete-orphan', info=PUBLIC)
    offers = relationship(EmployerOffer, backref='employer', order_by=EmployerOffer.created.desc())
    pictures = relationship(EmployerPicture, backref='employer', order_by=EmployerPicture.position,
                            collection_class=ordering_list('position'))

    admin_comment = Column(Text, info=ADMIN)

    @property
    def password(self):
        return self.pwd

    @password.setter
    def password(self, value):
        self.pwd = hash_pwd(value)


    @property
    def contact_name(self):
        return u'%s %s' % (self.contact_first_name, self.contact_last_name)

    @property
    def can_login(self):
        return self.deleted is None

    @classmethod
    def not_deleted(cls):
        """
        Unified Login does not know about status, so need to filter those that are soft-deleted
        == None is valid, as this is SqlAlchemy IS NULL
        :return:
        """
        return [Employer.deleted == None]

    @property
    def status(self):
        if self.deleted:
            return DELETED
        elif self.approved:
            return APPROVED
        elif self.agreedTos:
            return APPLIED
        elif self.pwd:
            return SIGNEDUP
        else:
            return INVITED

    @classmethod
    def by_status(cls, status):
        EMPLOYER_STATUS = {
            INVITED: (Employer.invite_token != None, Employer.pwd == None, Employer.deleted == None),
            SIGNEDUP: (Employer.pwd != None,
                       Employer.agreedTos == None,
                       Employer.approved == None,
                       Employer.deleted == None),
            APPLIED: (Employer.agreedTos != None, Employer.approved == None, Employer.deleted == None),
            APPROVED: (Employer.approved != None, Employer.pwd != None, Employer.deleted == None),
            DELETED: (Employer.deleted != None, )}
        if status not in EMPLOYER_STATUS:
            raise HTTPBadRequest("InvalidStatus Requested: %s is not one of %s" % (status, EMPLOYER_STATUS.keys()))
        else:
            return EMPLOYER_STATUS[status]

    def __json__(self, request):
        result = self.to_json(request)
        display = get_request_role(request, self.id)
        result.update(json_encoder(self, request, display))

        result['contact_salutation'] = self.contact_salutation
        result['company_type'] = self.company_type
        result['status'] = self.status
        result['offices'] = self.offices
        result['benefits'] = self.benefits
        result['tech_tags'] = self.tech_tags
        result['is_approved'] = self.approved is not None
        result['locale'] = self.locale

        if CANDIDATE in request.effective_principals:
            cebl = CandidateEmployerBlacklist
            blacklist_count = DBSession.query(cebl).filter(cebl.candidate_id == request.candidate_id,
                                                           cebl.employer_id == self.id).count()
            result['blacklisted_by_candidate'] = blacklist_count > 0

            if not blacklist_count:
                cbe = CandidateBookmarkEmployer
                bookmark_count = DBSession.query(cbe).filter(cbe.employer_id == self.id,
                                                             cbe.candidate_id == request.candidate_id).count()
                result['bookmarked_by_candidate'] = bookmark_count > 0

            active_offers = DBSession.query(Offer.id).filter(Offer.candidate_id == request.candidate_id,
                                                             Offer.employer_id == self.id,
                                                             Offer.by_active()).count()
            result['candidate_has_offers'] = active_offers > 0
            accepted_count = DBSession.query(Offer.id).filter(Offer.candidate_id == request.candidate_id,
                                                              Offer.employer_id == self.id,
                                                              Offer.has_accepted()).count()
            result['accepted_offers_by_candidate'] = accepted_count > 0

        return result


class EmbeddedEmployer(Employer):
    def __json__(self, request):
        return {"id": self.id,
                "company_name": self.company_name,
                "founding_year": self.founding_year,
                "website": self.website,
                "logo_url": self.logo_url,
                "image_video_url": self.image_video_url,
                "fb_url": self.fb_url,
                "linkedin_url": self.linkedin_url}


def sort_by_location(query, order_func):
    hq = get_by_name_or_raise(OfficeType, OfficeType.HQ)
    return query.outerjoin(Office).outerjoin(OfficeType).filter(or_(Office.type == hq, Office.id == None)) \
        .outerjoin(City).order_by(order_func(City.country_iso), order_func(City.name))


EMPLOYER_SORTABLES = {'id': Employer.id,
                      'created': Employer.created,
                      'name': Employer.company_name,
                      'email': Employer.email,
                      'location': sort_by_location}


