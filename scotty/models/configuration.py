from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index, UniqueConstraint
from scotty.models.meta import Base


class Title(Base):
    __tablename__ = 'title'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class CompanyType(Base):
    __tablename__ = 'company_type'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class SkillLevel(Base):
    __tablename__ = 'skill_level'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class Proficiency(Base):
    __tablename__ = 'proficiency'
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, unique=True)


class EducationDegree(Base):
    __tablename__ = 'education_degree'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class Skill(Base):
    __tablename__ = 'skill'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)


class Language(Base):
    __tablename__ = 'language'
    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False, unique=True)


class Role(Base):
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class JobTitle(Base):
    __tablename__ = 'job_title'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)


class Country(Base):
    __tablename__ = 'country'
    id = Column(Integer, primary_key=True)
    iso = Column(String(2), nullable=False, unique=True)
    name = Column(String(128), nullable=False, unique=True)


class City(Base):
    __tablename__ = 'city'
    __table_args__ = (UniqueConstraint("country_id", "name"), )
    id = Column(Integer, primary_key=True)
    country_id = Column(Integer, ForeignKey(Country.id), nullable=False)
    name = Column(String(255), nullable=False)
