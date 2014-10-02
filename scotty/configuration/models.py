from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Numeric
from scotty.models.meta import Base, NamedModel
from sqlalchemy.orm import relationship


class Seniority(Base, NamedModel):
    __tablename__ = 'seniority'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class Benefit(Base, NamedModel):
    __tablename__ = 'benefit'
    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False, unique=True)


class Salutation(Base, NamedModel):
    __tablename__ = 'salutation'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class CompanyType(Base, NamedModel):
    __tablename__ = 'company_type'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)

class OfficeType(Base, NamedModel):
    __tablename__ = 'office_type'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class SkillLevel(Base, NamedModel):
    __tablename__ = 'skill_level'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class Proficiency(Base, NamedModel):
    __tablename__ = 'proficiency'
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, unique=True)


class RejectionReason(Base, NamedModel):
    __tablename__ = 'rejectionreason'
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, unique=True)


class WithdrawalReason(Base, NamedModel):
    __tablename__ = 'withdrawalreason'
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, unique=True)


class TravelWillingness(Base, NamedModel):
    __tablename__ = 'travelwillingness'
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, unique=True)


class TrafficSource(Base, NamedModel):
    __tablename__ = 'traffic_source'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Degree(Base, NamedModel):
    __tablename__ = 'degree'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Course(Base, NamedModel):
    __tablename__ = 'course'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Skill(Base, NamedModel):
    __tablename__ = 'skill'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Language(Base, NamedModel):
    __tablename__ = 'language'
    id = Column(Integer, primary_key=True)
    iso_639_2 = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False, unique=True)


class Role(Base, NamedModel):
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class JobTitle(Base, NamedModel):
    __tablename__ = 'job_title'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Institution(Base, NamedModel):
    __tablename__ = 'institution'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Company(Base, NamedModel):
    __tablename__ = 'company'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Country(Base):
    __tablename__ = 'country'
    __name_field__ = 'name'
    iso = Column(String(2), primary_key=True)
    name = Column(String(128), nullable=False, unique=True)
    cities = relationship("City", backref="country")

    def __json__(self, request):
        return {'iso': self.iso, 'name': self.name}


class City(Base):
    __tablename__ = 'city'
    __table_args__ = (UniqueConstraint("country_iso", "name", name="city_name_country_unique"), )
    id = Column(Integer, primary_key=True)
    country_iso = Column(String(2), ForeignKey(Country.iso), nullable=False)
    name = Column(String(255), nullable=False)
    longitude = Column(Numeric)
    latitude = Column(Numeric)

    def __json__(self, request):
        return {'city': self.name, 'country_iso': self.country_iso}

    def __repr__(self):
        return '<%s: country:%s city:%s>' % (self.__class__.__name__, self.country_iso, self.name)