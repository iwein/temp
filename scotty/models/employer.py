from datetime import datetime
import hashlib
from uuid import uuid4
from pyramid.httpexceptions import HTTPBadRequest, HTTPInternalServerError
from scotty.models import City, TrafficSource, NamedModel, json_encoder, Skill, Benefit
from scotty.models.meta import Base, GUID
from sqlalchemy import Column, Text, String, Integer, ForeignKey, Date, CheckConstraint, Boolean, Table, DateTime
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
    created = Column(Date, nullable=False, default=datetime.now)

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


employer_skills = Table('employer_skills', Base.metadata,
                        Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                        Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))

employer_benefits = Table('employer_benefits', Base.metadata,
                          Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                          Column('benefit_id', Integer, ForeignKey('benefit.id'), primary_key=True))


class Employer(Base):
    __tablename__ = 'employer'
    __name_field__ = 'company_name'
    id = Column(GUID, primary_key=True, default=uuid4)
    company_name = Column(String(255), unique=True, nullable=False)

    email = Column(String(512), nullable=False, unique=True)
    pwd = Column(String(128))

    invite_token = Column(GUID)
    invite_sent = Column(DateTime)
    created = Column(DateTime, nullable=False, default=datetime.now)
    agreedTos = Column(DateTime)
    approved = Column(DateTime)

    website = Column(String(512))
    address_line1 = Column(String(512))
    address_line2 = Column(String(512))
    address_line3 = Column(String(512))
    address_zipcode = Column(String(20))
    address_city_id = Column(Integer, ForeignKey(City.id))
    address_city = relationship(City)

    contact_name = Column(String(255))
    contact_phone = Column(String(32))
    contact_email = Column(String(1024))
    contact_position = Column(String(128))

    logo_url = Column(String(512))
    image_video_url = Column(String(1024))

    mission_text = Column(Text)
    culture_text = Column(Text)
    vision_text = Column(Text)
    recruitment_process = Column(Text)
    training_policy = Column(Text)

    founding_date = Column(Date)
    revenue_pa = Column(Integer)
    funding_amount = Column(Integer)
    funding_text = Column(Text)

    no_of_employees = Column(Integer)
    tech_team_size = Column(Integer)
    tech_team_philosophy = Column(Text)

    tech_tags = relationship(Skill, secondary=employer_skills)
    benefits = relationship(Benefit, secondary=employer_benefits)

    external_rating = Column(Integer, CheckConstraint('external_rating between 0 and 5'))
    featured = Column(Boolean)

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource)

    offices = relationship(Office, backref='employer', cascade='all, delete, delete-orphan')

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
        city_id = result.pop('address_city_id', None)
        agreedTos = result.pop('agreedTos', None)
        approved = result.pop('approved', None)
        created = result.pop('created', None)
        result['address_city'] = self.address_city
        return result
