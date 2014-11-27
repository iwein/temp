import hashlib
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Boolean, Table, CheckConstraint, \
    UniqueConstraint, DateTime, func

from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import relationship

from scotty.models.common import get_by_name_or_raise
from scotty.models.tools import json_encoder, PUBLIC, PRIVATE, JsonSerialisable, ADMIN
from scotty.offer.models import CandidateOffer
from scotty.configuration.models import Country, City, TrafficSource, Skill, SkillLevel, Degree, Institution, Company, \
    Role, Language, Proficiency, Course, Salutation
from scotty.models.meta import Base, NamedModel, GUID


class InviteCode(Base):
    __tablename__ = 'invite_code'
    __name_field__ = 'code'
    id = Column(Integer, primary_key=True)
    created = Column(DateTime, nullable=False, default=datetime.now, info=PUBLIC)
    code = Column(String(64), nullable=False, unique=True, info=PUBLIC)
    description = Column(Text, info=PUBLIC)


class CandidateStatus(Base, NamedModel):
    __tablename__ = 'candidatestatus'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)

    PENDING = "pending"
    ACTIVE = "active"
    SLEEPING = "sleeping"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class Education(Base):
    __tablename__ = 'education'
    __table_args__ = (UniqueConstraint('candidate_id', 'institution_id', 'start', name='candidate_education_unique'),)
    created = Column(DateTime, nullable=False, default=datetime.now)

    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)
    start = Column(Integer, nullable=False)
    end = Column(Integer)

    course_id = Column(Integer, ForeignKey(Course.id))
    course = relationship(Course)

    institution_id = Column(Integer, ForeignKey(Institution.id), nullable=False)
    institution = relationship(Institution)

    degree_id = Column(Integer, ForeignKey(Degree.id))
    degree = relationship(Degree)

    def __json__(self, request):
        return {'institution': self.institution, "degree": self.degree, "id": self.id, "start": self.start, "end":
            self.end, "course": self.course}


class CandidateSkill(Base):
    __tablename__ = 'candidate_skill'
    candidate_id = Column(GUID, ForeignKey("candidate.id"), primary_key=True)
    created = Column(DateTime, nullable=False, default=datetime.now)

    skill_id = Column(Integer, ForeignKey(Skill.id), primary_key=True)
    skill = relationship(Skill)

    level_id = Column(Integer, ForeignKey(SkillLevel.id))
    level = relationship(SkillLevel)

    def __json__(self, request):
        result = {'skill': self.skill}
        if self.level:
            result["level"] = self.level
        return result

    @property
    def name(self):
        return self.skill.name

    def __repr__(self):
        return self.skill.name


work_experience_skill = Table('work_experience_skill', Base.metadata,
                              Column('work_experience_id', Integer, ForeignKey('work_experience.id'), primary_key=True),
                              Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))


class WorkExperience(Base):
    __tablename__ = 'work_experience'
    __table_args__ = (UniqueConstraint('candidate_id', 'company_id', 'start', name='candidate_work_experience_unique'),)

    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)

    start = Column(Date, nullable=False)
    end = Column(Date)
    summary = Column(Text)

    company_id = Column(Integer, ForeignKey(Company.id))
    company = relationship(Company)

    country_iso = Column(String(2), ForeignKey(Country.iso))
    city = Column(String(512))

    role_id = Column(Integer, ForeignKey("role.id"))
    role = relationship(Role)
    skills = relationship(Skill, secondary=work_experience_skill)

    def __json__(self, request):
        return {'start': self.start, "end": self.end, "id": self.id, "summary": self.summary, "role": self.role,
                "company": self.company, "skills": self.skills, 'city': self.city, 'country_iso': self.country_iso}


target_position_skills = Table('target_position_skills', Base.metadata,
                               Column('target_position_id', Integer, ForeignKey('target_position.id'), primary_key
                               =True),
                               Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))


class TargetPosition(Base):
    __tablename__ = 'target_position'

    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)
    minimum_salary = Column(Integer, nullable=False)
    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    role = relationship(Role)
    skills = relationship(Skill, secondary=target_position_skills)

    def __json__(self, request):
        return {"skills": self.skills, "role": self.role, "minimum_salary": self.minimum_salary}


class CandidateLanguage(Base):
    __tablename__ = 'candidate_language'
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False, primary_key=True)
    language_id = Column(Integer, ForeignKey(Language.id), nullable=False, primary_key=True)
    language = relationship(Language)
    proficiency_id = Column(Integer, ForeignKey(Proficiency.id), nullable=False)
    proficiency = relationship(Proficiency)

    def __json__(self, request):
        return {"language": self.language, "proficiency": self.proficiency}


class CandidateBookmarkEmployer(Base):
    __tablename__ = 'candidate_bookmark_employer'
    candidate_id = Column(GUID, ForeignKey('candidate.id'), primary_key=True)
    candidate = relationship('Candidate', backref='bookmarks')
    employer_id = Column(GUID, ForeignKey('employer.id'), primary_key=True)
    employer = relationship("Employer", backref='candidate_bookmarks')
    created = Column(DateTime, nullable=False, default=datetime.now, server_default=func.now())

    def __init__(self, candidate=None, employer=None):
        self.candidate = candidate
        self.employer = employer


class CandidateEmployerBlacklist(Base):
    __tablename__ = 'candidate_employer_blacklist'
    candidate_id = Column(GUID, ForeignKey('candidate.id'), primary_key=True)
    candidate = relationship("Candidate", backref="blacklist")

    employer_id = Column(GUID, ForeignKey('employer.id'), primary_key=True)
    employer = relationship("Employer")
    created = Column(DateTime, nullable=False, default=datetime.now, server_default=func.now())

    def __init__(self, candidate=None, employer=None):
        self.candidate = candidate
        self.employer = employer


class PreferredLocation(Base):
    __tablename__ = 'candidate_preferred_location'
    __table_args__ = (
        UniqueConstraint('candidate_id', 'country_iso', name='candidate_preferred_location_country_unique'),
        UniqueConstraint('candidate_id', 'city_id', name='candidate_preferred_location_city_unique'),
        CheckConstraint('country_iso ISNULL and city_id NOTNULL or country_iso NOTNULL and city_id ISNULL', name='candidate_preferred_location_has_some_fk'), )
    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey('candidate.id'))
    country_iso = Column(String(2), ForeignKey(Country.iso), nullable=True)
    city_id = Column(Integer, ForeignKey('city.id'), nullable=True)
    city = relationship(City, lazy="joined")

    def __repr__(self):
        return '<%s: country:%s city:%s>' % (self.__class__.__name__, self.country_iso, self.city_id)


class Candidate(Base, JsonSerialisable):
    __tablename__ = 'candidate'

    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    created = Column(DateTime, nullable=False, default=datetime.now)
    anonymous = Column(Boolean, default=False, nullable=False)
    pwdforgot_token = Column(GUID, unique=True, info=PRIVATE)
    pwdforgot_sent = Column(DateTime, info=PRIVATE)
    activation_token = Column(GUID, unique=True, default=uuid4, info=PRIVATE)
    activation_sent = Column(DateTime, info=PRIVATE)
    activated = Column(DateTime, info=PRIVATE)

    email = Column(String(512), nullable=False, unique=True, info=PUBLIC)
    pwd = Column(String(128), nullable=False)

    first_name = Column(String(512), nullable=False, info=PUBLIC)
    last_name = Column(String(512), nullable=False, info=PUBLIC)
    dob = Column(Date, info=PUBLIC)
    pob = Column(String(512), info=PUBLIC)
    picture_url = Column(String(1024), info=PUBLIC)

    salutation_id = Column(Integer, ForeignKey(Salutation.id))
    salutation = relationship(Salutation, info=PUBLIC)

    github_url = Column(String(1024), info=PUBLIC)
    stackoverflow_url = Column(String(1024), info=PUBLIC)
    eu_work_visa = Column(Boolean, info=PUBLIC)
    cv_upload_url = Column(String(1024))

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource)

    contact_line1 = Column(String(512), info=PUBLIC)
    contact_line2 = Column(String(512), info=PUBLIC)
    contact_line3 = Column(String(512), info=PUBLIC)
    contact_zipcode = Column(String(20), info=PUBLIC)
    location_id = Column(Integer, ForeignKey(City.id))
    location = relationship(City, info=PUBLIC)

    contact_phone = Column(String(128), info=PUBLIC)
    contact_skype = Column(String(128), info=PUBLIC)

    summary = Column(Text, info=PUBLIC)
    availability = Column(Text, info=PUBLIC)

    status_id = Column(Integer, ForeignKey(CandidateStatus.id), nullable=False)
    status = relationship(CandidateStatus)

    skills = relationship(CandidateSkill, backref="candidate", cascade="all, delete, delete-orphan")
    education = relationship(Education, backref="candidate", cascade="all, delete, delete-orphan",
                             order_by=Education.start.desc())
    languages = relationship(CandidateLanguage, backref="candidate", cascade="all, delete, delete-orphan")

    preferred_locations = relationship(PreferredLocation)

    work_experience = relationship(WorkExperience, backref="candidate", cascade="all, delete, delete-orphan",
                                   order_by=WorkExperience.start.desc())
    target_position = relationship(TargetPosition, backref="candidate", cascade="all, delete, delete-orphan",
                                   uselist=False, order_by=TargetPosition.created.desc())

    offers = relationship(CandidateOffer, backref='candidate', order_by=CandidateOffer.created.desc())

    bookmarked_employers = association_proxy('bookmarks', 'employer')
    blacklisted_employers = association_proxy('blacklist', 'employer')
    invite_code_id = Column(Integer, ForeignKey(InviteCode.id))
    invite_code = relationship(InviteCode)

    admin_comment = Column(Text, info=ADMIN)

    @property
    def full_name(self):
        return u'%s %s' % (self.first_name, self.last_name)

    @property
    def password(self):
        return self.pwd

    @password.setter
    def password(self, value):
        self.pwd = hashlib.sha256(value).hexdigest()

    @property
    def is_active(self):
        return self.status == get_by_name_or_raise(CandidateStatus, CandidateStatus.ACTIVE)

    def get_preferred_locations(self):
        if not self.preferred_locations:
            return None
        results = {}
        for pl in self.preferred_locations:
            if pl.country_iso:
                results.setdefault(pl.country_iso, [])
            elif pl.city_id:
                results.setdefault(pl.city.country_iso, []).append(pl.city.name)
        return results

    def __json__(self, request):
        result = self.to_json(request)
        result.update(json_encoder(self, request))
        result['id'] = self.id
        result['salutation'] = self.salutation
        result['status'] = self.status
        result['languages'] = self.languages
        result['skills'] = self.skills
        result['preferred_location'] = self.get_preferred_locations()
        result['location'] = self.location
        return result


class EmbeddedCandidate(Candidate):
    def __json__(self, request):
        return {"first_name": self.first_name, "last_name": self.last_name, "id": self.id,
                "picture_url": self.picture_url}


class WXPCandidate(Candidate):
    def __json__(self, request):
        result = super(WXPCandidate, self).__json__(request)
        result['work_experience'] = self.work_experience
        return result


class FullCandidate(WXPCandidate):
    def __json__(self, request):
        result = super(FullCandidate, self).__json__(request)
        result['email'] = self.email
        result['traffic_source'] = self.traffic_source
        result['activation_token'] = self.activation_token
        result['activation_sent'] = self.activation_sent
        result['admin_comment'] = self.admin_comment
        result['invite_code'] = self.invite_code
        return result
