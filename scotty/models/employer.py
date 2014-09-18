from datetime import datetime
import hashlib
from uuid import uuid4

from pyramid.httpexceptions import HTTPBadRequest
from scotty.models.configuration import City, TrafficSource, Skill, Benefit
from scotty.models.offer import EmployerOffer
from scotty.models.meta import Base, GUID
from scotty.models.tools import PUBLIC, PRIVATE, json_encoder
from sqlalchemy import Column, Text, String, Integer, ForeignKey, DateTime, CheckConstraint, Boolean, Table, DateTime
from sqlalchemy.orm import relationship


employer_address_mapping = {'line1': 'address_line1', 'line2': 'address_line2', 'line3': 'address_line3',
                            'zipcode': 'address_zipcode'}

INVITED = 'INVITED'
SIGNEDUP = 'SIGNEDUP'
APPLIED = 'APPLIED'
APPROVED = 'APPROVED'


class Office(Base):
    __tablename__ = 'employer_office'
    id = Column(Integer, primary_key=True)
    employer_id = Column(GUID, ForeignKey('employer.id'), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)

    website = Column(String(512))
    address_line1 = Column(String(512), nullable=False)
    address_line2 = Column(String(512))
    address_line3 = Column(String(512))
    address_zipcode = Column(String(20), nullable=False)
    address_city_id = Column(Integer, ForeignKey(City.id), nullable=False)
    address_city = relationship(City)

    contact_name = Column(String(255), nullable=False)
    contact_phone = Column(String(32))
    contact_email = Column(String(1024), nullable=False)
    contact_position = Column(String(128))

    def __json__(self, request):
        result = {'id': self.id,
                  'website': self.website,
                  'contact_name': self.contact_email,
                  'contact_phone': self.contact_phone,
                  'contact_email': self.contact_email,
                  'contact_position': self.contact_position,
                  'address_line1': self.address_line1,
                  'address_line2': self.address_line2,
                  'address_line3': self.address_line3,
                  'address_zipcode': self.address_zipcode,
                  'address_city': self.address_city}
        return result


employer_skills = Table('employer_skill', Base.metadata,
                        Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                        Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))

employer_benefits = Table('employer_benefit', Base.metadata,
                          Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                          Column('benefit_id', Integer, ForeignKey('benefit.id'), primary_key=True))



class Employer(Base):
    __tablename__ = 'employer'
    __name_field__ = 'company_name'
    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    company_name = Column(String(255), unique=True, nullable=False, info=PUBLIC)

    email = Column(String(512), nullable=False, unique=True, info=PRIVATE)
    pwd = Column(String(128))

    invite_token = Column(GUID, info=PRIVATE)
    invite_sent = Column(DateTime, info=PRIVATE)
    created = Column(DateTime, nullable=False, default=datetime.now)
    agreedTos = Column(DateTime)
    approved = Column(DateTime)

    website = Column(String(512), info=PUBLIC)
    address_line1 = Column(String(512), info=PUBLIC)
    address_line2 = Column(String(512), info=PUBLIC)
    address_line3 = Column(String(512), info=PUBLIC)
    address_zipcode = Column(String(20), info=PUBLIC)
    address_city_id = Column(Integer, ForeignKey(City.id))
    address_city = relationship(City, info=PUBLIC)

    contact_name = Column(String(255), info=PUBLIC)
    contact_phone = Column(String(32), info=PUBLIC)
    contact_email = Column(String(1024), info=PUBLIC)
    contact_position = Column(String(128), info=PUBLIC)

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
    benefits = relationship(Benefit, secondary=employer_benefits, info=PUBLIC)

    external_rating = Column(Integer, CheckConstraint('external_rating between 0 and 5'), info=PUBLIC)
    featured = Column(Boolean)

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource, info=PUBLIC)

    offices = relationship(Office, backref='employer', cascade='all, delete, delete-orphan', info=PUBLIC)
    offers = relationship(EmployerOffer, backref='employer')


    def set_pwd(self, pwd):
        self.pwd = hashlib.sha256(pwd).hexdigest()

    @property
    def status(self):
        if self.approved:
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
            INVITED: (Employer.invite_token != None, Employer.pwd == None),
            SIGNEDUP: (Employer.pwd != None, Employer.agreedTos == None, Employer.approved == None),
            APPLIED: (Employer.agreedTos != None, Employer.approved == None),
            APPROVED: (Employer.approved != None, Employer.pwd != None)
        }

        if status not in EMPLOYER_STATUS:
            raise HTTPBadRequest("InvalidStatus Requested: %s is not one of %s" % (status, EMPLOYER_STATUS.keys()))
        else:
            return EMPLOYER_STATUS[status]

    def __json__(self, request):
        result = json_encoder(self, request)

        result['status'] = self.status
        result['offices'] = self.offices
        result['benefits'] = self.benefits
        result['tech_tags'] = self.tech_tags
        result['address_city'] = self.address_city
        return result


class EmbeddedEmployer(Employer):
    def __json__(self, request):
        return json_encoder(self, request)

class MatchedEmployer(Employer):
    def __json__(self, request):
        result = super(MatchedEmployer, self).__json__(request)
        result['matched_tags'] = self.matched_tags
        return result


class FullEmployer(Employer):
    def __json__(self, request):
        result = super(FullEmployer, self).__json__(request)
        return result

