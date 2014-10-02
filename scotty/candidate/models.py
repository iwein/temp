import hashlib
from uuid import uuid4
from datetime import datetime
from scotty.models.tools import json_encoder, PUBLIC, PRIVATE

from scotty.offer.models import CandidateOffer
from scotty.configuration.models import Country, City, TrafficSource, Skill, SkillLevel, Degree, Institution, \
    Company, Role, Language, Proficiency, CompanyType, Seniority, Course, TravelWillingness, Salutation
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Boolean, Table, CheckConstraint, \
    UniqueConstraint, DateTime, func
from scotty.models.meta import Base, NamedModel, GUID
from sqlalchemy.orm import relationship


class CandidateStatus(Base, NamedModel):
    __tablename__ = 'candidatestatus'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)


class Education(Base):
    __tablename__ = 'education'
    __table_args__ = (UniqueConstraint('candidate_id', 'institution_id', 'start', name='candidate_education_unique'),)
    created = Column(DateTime, nullable=False, default=datetime.now)

    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)
    start = Column(Integer, nullable=False)
    end = Column(Integer)

    course_id = Column(Integer, ForeignKey(Course.id), nullable=False)
    course = relationship(Course)

    institution_id = Column(Integer, ForeignKey(Institution.id), nullable=False)
    institution = relationship(Institution)

    degree_id = Column(Integer, ForeignKey(Degree.id), nullable=True)
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
    summary = Column(Text, nullable=False)

    company_id = Column(Integer, ForeignKey(Company.id), nullable=False)
    company = relationship(Company)

    country_iso = Column(String(2), ForeignKey(Country.iso), nullable=False)
    city = Column(String(512))

    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    role = relationship(Role)
    skills = relationship(Skill, secondary=work_experience_skill)

    def __json__(self, request):
        return {'start': self.start, "end": self.end, "id": self.id, "summary": self.summary, "role": self.role,
                "company": self.company, "skills": self.skills, 'city': self.city, 'country_iso': self.country_iso}


target_position_company_type = Table('target_position_company_type', Base.metadata,
                                     Column('target_position_id', Integer, ForeignKey('target_position.id'), primary_key=True),
                                     Column('company_type_id', Integer, ForeignKey('company_type.id'), primary_key=True))

target_position_skills = Table('target_position_skills', Base.metadata,
                               Column('target_position_id', Integer, ForeignKey('target_position.id'), primary_key=True),
                               Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))


class TargetPosition(Base):
    __tablename__ = 'target_position'

    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)
    minimum_salary = Column(Integer, nullable=False)
    relocate = Column(Boolean)

    travel_willingness_id = Column(Integer, ForeignKey("travelwillingness.id"), nullable=False, server_default='1')
    travel_willingness = relationship(TravelWillingness)

    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    role = relationship(Role)
    skills = relationship(Skill, secondary=target_position_skills)
    company_types = relationship(CompanyType, secondary=target_position_company_type)

    def __json__(self, request):
        return {"id": self.id, "skills": self.skills, "role": self.role, 'travel_willingness': self.travel_willingness,
                'relocate': self.relocate, "minimum_salary": self.minimum_salary, "company_types": self.company_types}


class CandidateLanguage(Base):
    __tablename__ = 'candidate_language'
    candidate_id = Column(GUID, ForeignKey("candidate.id"), nullable=False, primary_key=True)
    language_id = Column(Integer, ForeignKey(Language.id), nullable=False, primary_key=True)
    language = relationship(Language)
    proficiency_id = Column(Integer, ForeignKey(Proficiency.id), nullable=False)
    proficiency = relationship(Proficiency)

    def __json__(self, request):
        return {"language": self.language, "proficiency": self.proficiency}


candidate_bookmark_employer = Table('candidate_bookmark_employer', Base.metadata,
                                    Column('candidate_id', GUID, ForeignKey('candidate.id'), primary_key=True),
                                    Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                                    Column('created', DateTime, nullable=False, default=datetime.now,
                                           server_default=func.now()))

candidate_employer_blacklist = Table('candidate_employer_blacklist', Base.metadata,
                                     Column('candidate_id', GUID, ForeignKey('candidate.id'), primary_key=True),
                                     Column('employer_id', GUID, ForeignKey('employer.id'), primary_key=True),
                                     Column('created', DateTime, nullable=False, default=datetime.now, server_default=func.now()))


class PreferredLocation(Base):
    __tablename__ = 'candidate_preferred_location'
    __table_args__ = (UniqueConstraint('candidate_id', 'country_iso', name='candidate_preferred_location_country_unique'),
                      UniqueConstraint('candidate_id', 'city_id', name='candidate_preferred_location_city_unique'),
                      CheckConstraint('country_iso ISNULL and city_id NOTNULL or country_iso NOTNULL and city_id ISNULL',
                                      name='candidate_preferred_location_has_some_fk'), )
    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey('candidate.id'))
    country_iso = Column(String(2), ForeignKey(Country.iso), nullable=True)
    city_id = Column(Integer, ForeignKey('city.id'), nullable=True)
    city = relationship(City, lazy="joined")

    def __repr__(self):
        return '<%s: country:%s city:%s>' % (self.__class__.__name__, self.country_iso, self.city_id)


class Candidate(Base):
    __tablename__ = 'candidate'
    __editable__ = ['first_name', 'last_name', 'pob', 'dob', 'picture_url', 'salutation', 'contact_line1', 'contact_line2',
                    'contact_line3', 'contact_zipcode', 'contact_city', 'contact_country_iso', 'contact_phone',
                    'availability', 'summary', 'github_url',
                    'stackoverflow_url', 'contact_skype']

    id = Column(GUID, primary_key=True, default=uuid4, info=PUBLIC)
    created = Column(DateTime, nullable=False, default=datetime.now)
    pwdforgot_token = Column(GUID, unique=True, info=PRIVATE)
    pwdforgot_sent = Column(DateTime, info=PRIVATE)
    activation_token = Column(GUID, unique=True, default=uuid4, info=PRIVATE)
    activation_sent = Column(DateTime, info=PRIVATE)
    activated = Column(DateTime, info=PRIVATE)

    email = Column(String(512), nullable=False, unique=True)
    pwd = Column(String(128), nullable=False)

    first_name = Column(String(512), nullable=False, info=PUBLIC)
    last_name = Column(String(512), nullable=False, info=PUBLIC)
    dob = Column(Date)
    pob = Column(String(512))
    picture_url = Column(String(1024), info=PUBLIC)

    salutation_id = Column(Integer, ForeignKey(Salutation.id))
    salutation = relationship(Salutation)

    summary = Column(Text(), info=PUBLIC)
    github_url = Column(String(1024), info=PUBLIC)
    stackoverflow_url = Column(String(1024), info=PUBLIC)

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource)

    contact_line1 = Column(String(512))
    contact_line2 = Column(String(512))
    contact_line3 = Column(String(512))
    contact_zipcode = Column(String(20))
    contact_city = Column(String(512))
    contact_country_iso = Column(String(2), ForeignKey(Country.iso), info=PUBLIC)
    contact_country = relationship(Country)

    contact_phone = Column(String(128))
    contact_skype = Column(String(128))
    availability = Column(Text)

    status_id = Column(Integer, ForeignKey(CandidateStatus.id), nullable=False)
    status = relationship(CandidateStatus)

    skills = relationship(CandidateSkill, backref="candidate", cascade="all, delete, delete-orphan")
    education = relationship(Education, backref="candidate", cascade="all, delete, delete-orphan")
    languages = relationship(CandidateLanguage, backref="candidate", cascade="all, delete, delete-orphan")

    preferred_locations = relationship(PreferredLocation)

    work_experience = relationship(WorkExperience, backref="candidate", cascade="all, delete, delete-orphan")
    target_positions = relationship(TargetPosition, backref="candidate", cascade="all, delete, delete-orphan")

    offers = relationship(CandidateOffer, backref='candidate', order_by=CandidateOffer.created.desc())

    bookmarked_employers = relationship("Employer", secondary=candidate_bookmark_employer,
                                        order_by=candidate_bookmark_employer.c.created.desc(),
                                        backref="interested_candidates")

    blacklisted_employers = relationship("Employer", secondary=candidate_employer_blacklist,
                                         order_by=candidate_employer_blacklist.c.created.desc(),
                                         backref="blacklisted")

    @property
    def full_name(self):
        return u'%s %s' % (self.first_name, self.last_name)

    @property
    def password(self):
        return self.pwd

    @password.setter
    def password(self, value):
        self.pwd = hashlib.sha256(value).hexdigest()

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
        result = {k: getattr(self, k) for k in self.__editable__ if getattr(self, k) is not None}
        result['id'] = self.id
        result['salutation'] = self.salutation
        result['status'] = self.status
        result['languages'] = self.languages
        result['skills'] = self.skills
        result['preferred_location'] = self.get_preferred_locations()
        result['contact_country'] = self.contact_country
        return result


class EmbeddedCandidate(Candidate):
    def __json__(self, request):
        return json_encoder(self, request)


class WXPCandidate(Candidate):
    def __json__(self, request):
        result = super(WXPCandidate, self).__json__(request)
        result['work_experience'] = self.work_experience
        return result


class MatchedCandidate(WXPCandidate):
    matched_tags = None
    def __json__(self, request):
        result = super(MatchedCandidate, self).__json__(request)
        result['matched_tags'] = self.matched_tags
        return result


class FullCandidate(WXPCandidate):
    def __json__(self, request):
        result = super(FullCandidate, self).__json__(request)
        result['email'] = self.email
        result['traffic_source'] = self.traffic_source
        result['activation_token'] = self.activation_token
        result['activation_sent'] = self.activation_sent
        return result
