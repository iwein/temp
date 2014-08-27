from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index, UniqueConstraint, Numeric, func
from scotty.models.meta import Base, NamedModel
from sqlalchemy.orm import relationship


class Title(Base, NamedModel):
    __tablename__ = 'title'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class CompanyType(Base, NamedModel):
    __tablename__ = 'company_type'
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


class TrafficSource(Base, NamedModel):
    __tablename__ = 'traffic_source'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class EducationDegree(Base, NamedModel):
    __tablename__ = 'education_degree'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class Skill(Base, NamedModel):
    __tablename__ = 'skill'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)


class Language(Base, NamedModel):
    __tablename__ = 'language'
    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False, unique=True)


class Role(Base, NamedModel):
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class JobTitle(Base, NamedModel):
    __tablename__ = 'job_title'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Country(Base):
    __tablename__ = 'country'
    iso = Column(String(2), primary_key=True)
    name = Column(String(128), nullable=False, unique=True)
    cities = relationship("City", backref="country")

    def __json__(self, request):
        return {'iso': self.iso, 'name': self.name}


class City(Base):
    __tablename__ = 'city'
    __table_args__ = (UniqueConstraint("country_iso", "name"), )
    id = Column(Integer, primary_key=True)
    country_iso = Column(String(2), ForeignKey(Country.iso), nullable=False)
    name = Column(String(255), nullable=False)
    longitude = Column(Numeric)
    latitude = Column(Numeric)

    def __json__(self, request):
        return {'name': self.name, 'country': self.country}


# Had to be done on sql level
#Index('city_names_lower', func.lower(City.name))
#Index('country_names_lower', func.lower(Country.name))