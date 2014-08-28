from uuid import uuid4
from datetime import datetime

from scotty.models.configuration import Title, Country, City, TrafficSource, Skill, SkillLevel, EducationDegree, \
    Institution, Company, Role, JobTitle, Language, Proficiency, CompanyType

from scotty.models.tools import json_encoder
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Boolean, func, Table, CheckConstraint
from scotty.models.meta import Base, NamedModel, GUID
from sqlalchemy.orm import relationship


class CandidateStatus(Base, NamedModel):
    __tablename__ = 'candidate_status'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class CandidateEducation(Base):
    __tablename__ = 'candidate_education'

    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)
    start = Column(Date, nullable=False)
    end = Column(Date, nullable=False)
    course = Column(String(512), nullable=False)

    institution_id = Column(Integer, ForeignKey(Institution.id), nullable=False)
    institution = relationship(Institution)

    degree_id = Column(Integer, ForeignKey(EducationDegree.id), nullable=False)
    degree = relationship(EducationDegree)

    def __json__(self, request):
        return {'institution': self.institution, "degree": self.degree, "id": self.id,
                "start": self.start, "end": self.end, "course": self.course}


class CandidateSkill(Base):
    __tablename__ = 'candidate_skill'
    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)

    skill_id = Column(Integer, ForeignKey(Skill.id), nullable=False)
    skill = relationship(Skill)

    skill_level_id = Column(Integer, ForeignKey(SkillLevel.id), nullable=False)
    level = relationship(SkillLevel)

    def __json__(self, request):
        return {'name': self.skill, "level": self.level, "id": self.id}


candidate_work_experience_role = Table('candidate_work_experience_role', Base.metadata,
                                       Column('work_experience_id', Integer, ForeignKey('candidate_work_experience.id')),
                                       Column('role_id', Integer, ForeignKey('role.id')))

target_position_role_table = Table('target_position_role_table', Base.metadata,
                                   Column('target_position_id', Integer, ForeignKey('candidate_work_experience.id')),
                                   Column('role_id', Integer, ForeignKey('role.id')))


target_position_skills_table = Table('target_position_skills_table', Base.metadata,
                                     Column('target_position_id', Integer, ForeignKey('candidate_work_experience.id')),
                                     Column('skill_id', Integer, ForeignKey('skill.id')))


candidate_work_experience_job_title = Table('candidate_work_experience_job_title', Base.metadata,
                                            Column('work_experience_id', Integer, ForeignKey('candidate_target_position.id')),
                                            Column('job_title_id', Integer, ForeignKey('job_title.id')))


candidate_preferred_cities = Table('candidate_preferred_cities', Base.metadata,
                                   Column('candidate_id', GUID, ForeignKey('candidate.id')),
                                   Column('city_id', Integer, ForeignKey('city.id')))

class WorkExperience(Base):
    __tablename__ = 'candidate_work_experience'
    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)

    start = Column(Date, nullable=False)
    end = Column(Date, nullable=False)
    summary = Column(Text, nullable=False)

    company_id = Column(Integer, ForeignKey(Company.id), nullable=False)
    company = relationship(Company)

    city_id = Column(Integer, ForeignKey(City.id), nullable=False)
    location = relationship(City)

    roles = relationship(Role, secondary="candidate_work_experience_role")
    job_titles = relationship(JobTitle, secondary="candidate_work_experience_job_title")

    def __json__(self, request):
        return {'start': self.start, "end": self.end, "id": self.id, "summary": self.summary,
                "roles": self.roles, "job_titles": self.job_titles, "company": self.company,
                "location": self.location}


class TargetPosition(Base):
    __tablename__ = 'candidate_target_position'
    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)

    roles = relationship(Role, secondary="target_position_role_table")
    skills = relationship(Skill, secondary="target_position_skills_table")

    level_id = Column(Integer, ForeignKey(SkillLevel.id))
    level = relationship(SkillLevel)

    company_type_id = Column(Integer, ForeignKey(CompanyType.id))
    company_type = relationship(CompanyType)

    minimum_salary = Column(Integer, nullable=False)
    benefits = Column(Text)



class CandidateLanguage(object):
    __tablename__ = 'candidate_language'
    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)
    language_id = Column(Integer, ForeignKey(Language.id), nullable=False)
    proficiency_id = Column(Integer, ForeignKey(Proficiency.id), nullable=False)


class Candidate(Base):
    __tablename__ = 'candidate'
    id = Column(GUID, primary_key=True, default=uuid4)
    email = Column(String(512), nullable=False, unique=True)
    pwd = Column(String(128), nullable=False)
    created = Column(Date, nullable=False, default=datetime.now)

    first_name = Column(String(512), nullable=False)
    last_name = Column(String(512), nullable=False)
    dob = Column(Date)
    pob = Column(String(512))
    picture_url = Column(String(1024))

    title_id = Column(Integer, ForeignKey(Title.id))
    title = relationship(Title)

    residence_country_iso = Column(String(2), ForeignKey(Country.iso))
    residence_country = relationship(Country)

    summary = Column(Text())
    github_url = Column(String(1024))
    stackoverflow_url = Column(String(1024))

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource)

    contact_line1 = Column(String(512))
    contact_line2 = Column(String(512))
    contact_line3 = Column(String(512))
    contact_zipcode = Column(String(20))
    contact_city_id = Column(Integer, ForeignKey(City.id))
    contact_city = relationship(City)

    available_date = Column(Date)
    notice_period_number = Column(Integer)
    notice_period_measure = Column(String(1), CheckConstraint("notice_period_measure in ['w', 'm']"), default='w',
                                   nullable=False)

    status_id = Column(Integer, ForeignKey(CandidateStatus.id), nullable=False)
    status = relationship(CandidateStatus)

    willing_to_travel = Column(Boolean)

    skills = relationship(CandidateSkill, backref="candidate", cascade="all, delete, delete-orphan")
    education = relationship(CandidateEducation, backref="candidate", cascade="all, delete, delete-orphan")
    languages = relationship(CandidateLanguage, backref="candidate", cascade="all, delete, delete-orphan")
    preferred_cities = relationship(City, secondary="candidate_preferred_cities")
    target_positions = relationship(TargetPosition, backref="candidate", cascade="all, delete, delete-orphan")

    def __json__(self, request):
        result = json_encoder(self, request)
        result['status'] = self.status
        #these get loaded via API
        #result['skills'] = self.skills
        #result['education'] = self.education
        #result['work_experience'] = self.work_experience
        result['languages'] = self.languages
        result['preferred_cities'] = self.preferred_cities
        return result