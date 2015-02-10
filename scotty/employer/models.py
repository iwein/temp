from datetime import datetime
import hashlib
from uuid import uuid4

from pyramid.httpexceptions import HTTPBadRequest
from scotty.auth.provider import CANDIDATE
from scotty.candidate.models import CandidateEmployerBlacklist, CandidateBookmarkEmployer
from scotty.services import hash_pwd
from sqlalchemy.ext.associationproxy import association_proxy
from scotty.configuration.models import City, TrafficSource, Skill, Benefit, Salutation, OfficeType, CompanyType, Locale
from scotty.offer.models import EmployerOffer, Offer
from scotty.models.meta import Base, GUID, DBSession
from scotty.models.tools import PUBLIC, PRIVATE, json_encoder, JsonSerialisable, get_request_role, DISPLAY_ADMIN, \
    DISPLAY_PRIVATE
from sqlalchemy import Column, Text, String, Integer, ForeignKey, CheckConstraint, Boolean, Table, DateTime
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


class Employer(Base, JsonSerialisable):
    __tablename__ = 'employer'
    __name_field__ = 'company_name'
    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    company_name = Column(String(255), nullable=False, info=PUBLIC)
    pwdforgot_token = Column(GUID, unique=True, info=PRIVATE)
    pwdforgot_sent = Column(DateTime, info=PRIVATE)
    invite_token = Column(GUID, info=PRIVATE)
    invite_sent = Column(DateTime, info=PRIVATE)
    created = Column(DateTime, nullable=False, default=datetime.now)
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
    revenue_pa = Column(Integer, info=PUBLIC)
    funding_amount = Column(Integer, info=PUBLIC)
    funding_text = Column(Text, info=PUBLIC)

    no_of_employees = Column(Integer, info=PUBLIC)
    tech_team_size = Column(Integer, info=PUBLIC)
    tech_team_philosophy = Column(Text, info=PUBLIC)

    tech_tags = relationship(Skill, secondary=employer_skills, info=PUBLIC)
    other_benefits = Column(Text, info=PUBLIC)
    benefits = relationship(Benefit, secondary=employer_benefits, info=PUBLIC)

    external_rating = Column(Integer, CheckConstraint('external_rating between 0 and 5'), info=PUBLIC)
    featured = Column(Boolean)

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource, info=PUBLIC)

    interested_candidates = association_proxy('candidate_bookmarks', 'candidate')

    offices = relationship(Office, backref='employer', cascade='all, delete, delete-orphan', info=PUBLIC)
    offers = relationship(EmployerOffer, backref='employer', order_by=EmployerOffer.created.desc())

    admin_comment = Column(Text)

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
            SIGNEDUP: (Employer.pwd != None, Employer.agreedTos == None, Employer.approved == None, Employer.deleted == None),
            APPLIED: (Employer.agreedTos != None, Employer.approved == None, Employer.deleted == None),
            APPROVED: (Employer.approved != None, Employer.pwd != None, Employer.deleted == None),
            DELETED: (Employer.deleted != None, ),
        }
        if status not in EMPLOYER_STATUS:
            raise HTTPBadRequest("InvalidStatus Requested: %s is not one of %s" % (status, EMPLOYER_STATUS.keys()))
        else:
            return EMPLOYER_STATUS[status]

    def __json__(self, request):
        result = self.to_json(request)
        result.update(json_encoder(self, request))
        result['contact_salutation'] = self.contact_salutation
        result['company_type'] = self.company_type
        result['status'] = self.status
        result['offices'] = self.offices
        result['benefits'] = self.benefits
        result['tech_tags'] = self.tech_tags
        result['is_approved'] = self.approved is not None
        result['locale'] = self.locale

        display = get_request_role(request, self.id)
        if DISPLAY_ADMIN in display or DISPLAY_PRIVATE in display:
            result['invite_token'] = self.invite_token
            result['invite_sent'] = self.invite_sent
            result['email'] = self.email
            result['admin_comment'] = self.admin_comment

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


class FullEmployer(Employer):
    def __json__(self, request):
        result = super(FullEmployer, self).__json__(request)
        result['invite_token'] = self.invite_token
        result['invite_sent'] = self.invite_sent
        result['email'] = self.email
        result['admin_comment'] = self.admin_comment
        return result

