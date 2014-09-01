from datetime import datetime
from uuid import uuid4
from scotty.models import City, TrafficSource, NamedModel, json_encoder
from scotty.models.meta import Base, GUID
from sqlalchemy import Column, Text, String, Integer, ForeignKey, Date, CheckConstraint, Boolean
from sqlalchemy.orm import relationship


employer_address_mapping = {'line1': 'address_line1', 'line2': 'address_line2', 'line3': 'address_line3',
                            'zipcode': 'address_zipcode'}


class EmployerStatus(Base, NamedModel):
    __tablename__ = 'employerstatus'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


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
                  'contact_position': self.contact_position}

        address = self.address_city.__json__(request) if self.address_city_id else {}

        for k, v in employer_address_mapping.items():
            if getattr(self, v, None):
                address[k] = getattr(self, v)

        result['address'] = address
        return result


class Employer(Base):

    __tablename__ = 'employer'
    id = Column(GUID, primary_key=True, default=uuid4)
    company_name = Column(String(255), nullable=False)
    created = Column(Date, nullable=False, default=datetime.now)

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
    culture_text= Column(Text)
    vision_text= Column(Text)

    founding_date = Column(Date)
    revenue_pa = Column(Integer)
    funding = Column(Text)

    no_of_employees = Column(Integer)
    tech_team_size = Column(Integer)
    tech_team_philosophy = Column(Text)
    benefits = Column(Text)

    status_id = Column(Integer, ForeignKey(EmployerStatus.id), nullable=False)
    status = relationship(EmployerStatus)

    external_rating = Column(Integer, CheckConstraint('external_rating between 0 and 5'))
    featured = Column(Boolean)
    recruitment_process = Column(Text)

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource)

    offices = relationship(Office, backref='employer', cascade='all, delete, delete-orphan')
    users = relationship('EmployerUser', backref='employer', cascade='all, delete, delete-orphan')

    def __json__(self, request):
        result = json_encoder(self, request)
        result['status'] = self.status
        result['offices'] = self.offices

        city_id = result.pop('address_city_id', None)
        address = self.address_city.__json__(request) if city_id else {}
        for k, v in employer_address_mapping.items():
            if v in result:
                address[k] = result.pop(v)

        result['address'] = address
        return result


class EmployerUser(Base):
    __tablename__ = 'employer_user'
    id = Column(GUID, primary_key=True, default=uuid4)
    employer_id = Column(GUID, ForeignKey('employer.id'), nullable=False)

    created = Column(Date, nullable=False, default=datetime.now)

    name = Column(String(512))
    email = Column(String(512), nullable=False, unique=True)
    pwd = Column(String(128), nullable=False)

    def __json__(self, request):
        return {'name': self.name, 'email': self.email, 'employer': self.employer}