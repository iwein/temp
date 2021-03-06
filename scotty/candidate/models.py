# coding=utf-8
from operator import attrgetter
from uuid import uuid4
from datetime import datetime

from scotty.auth.provider import EMPLOYER
from scotty.services import hash_pwd
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Boolean, Table, CheckConstraint, \
    UniqueConstraint, DateTime, func, and_, or_, BigInteger, select, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import relationship, foreign
from scotty.models.common import get_by_name_or_raise
from scotty.models.tools import json_encoder, PUBLIC, PRIVATE, JsonSerialisable, ADMIN, DISPLAY_ALWAYS, \
    DISPLAY_PRIVATE, get_request_role, DISPLAY_ADMIN
from scotty.offer.models import CandidateOffer, Offer, OFFER_STATUS_ACTIVE_KEY
from scotty.configuration.models import Country, City, TrafficSource, Skill, SkillLevel, Degree, Institution, Company, \
    Role, Language, Proficiency, Course, Salutation, Locale
from scotty.models.meta import Base, NamedModel, GUID, DBSession
from sqlalchemy.sql import table, column


V_CANDIDATE_FT_INDEX = table('v_candidate_search',
                             column('id', GUID),
                             column('status'),
                             column('search_index'),
                             column('employer_ids', ARRAY(String)),
                             column('current_employer_ids', ARRAY(String)))

V_CANDIDATE_CURRENT_EMPLOYERS = table('v_candidate_current_employers',
                                      column('candidate_id', GUID),
                                      column('employer_id', GUID))


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

    PENDING = 'pending'
    ACTIVE = 'active'
    SLEEPING = 'sleeping'
    SUSPENDED = 'suspended'
    DELETED = 'deleted'


class Education(Base):
    __tablename__ = 'education'
    __table_args__ = (UniqueConstraint('candidate_id', 'institution_id', 'start', name='candidate_education_unique'),)
    created = Column(DateTime, nullable=False, default=datetime.now)

    id = Column(Integer, primary_key=True)
    candidate_id = Column(GUID, ForeignKey('candidate.id'), nullable=False)
    start = Column(Integer, nullable=False)
    end = Column(Integer)

    course_id = Column(Integer, ForeignKey(Course.id))
    course = relationship(Course)

    institution_id = Column(Integer, ForeignKey(Institution.id), nullable=False)
    institution = relationship(Institution)

    degree_id = Column(Integer, ForeignKey(Degree.id))
    degree = relationship(Degree)

    def __json__(self, request):
        return {'institution': self.institution, 'degree': self.degree, 'id': self.id, 'start': self.start, 'end':
            self.end, 'course': self.course}


class CandidateSkill(Base):
    __tablename__ = 'candidate_skill'
    candidate_id = Column(GUID, ForeignKey('candidate.id'), primary_key=True)
    created = Column(DateTime, nullable=False, default=datetime.now)

    skill_id = Column(Integer, ForeignKey(Skill.id), primary_key=True)
    skill = relationship(Skill)

    level_id = Column(Integer, ForeignKey(SkillLevel.id))
    level = relationship(SkillLevel)

    def __json__(self, request):
        result = {'skill': self.skill}
        if self.level:
            result['level'] = self.level
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
    candidate_id = Column(GUID, ForeignKey('candidate.id'), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)

    start = Column(Date)
    end = Column(Date)
    summary = Column(Text)

    company_id = Column(Integer, ForeignKey(Company.id))
    company = relationship(Company)

    country_iso = Column(String(2), ForeignKey(Country.iso))
    country = relationship(Country)
    city = Column(String(512))

    role_id = Column(Integer, ForeignKey('role.id'))
    role = relationship(Role)
    skills = relationship(Skill, secondary=work_experience_skill)

    def __json__(self, request):
        return {'start': self.start, 'end': self.end, 'id': self.id, 'summary': self.summary, 'role': self.role,
                'company': self.company, 'skills': self.skills, 'city': self.city, 'country_iso': self.country_iso}


target_position_skills = Table('target_position_skills', Base.metadata,
                               Column('target_position_candidate_id', GUID, ForeignKey('target_position.candidate_id'),
                                      primary_key=True),
                               Column('skill_id', Integer, ForeignKey('skill.id'), primary_key=True))


class CandidateLanguage(Base):
    __tablename__ = 'candidate_language'
    candidate_id = Column(GUID, ForeignKey('candidate.id'), nullable=False, primary_key=True)
    language_id = Column(Integer, ForeignKey(Language.id), nullable=False, primary_key=True)
    language = relationship(Language)
    proficiency_id = Column(Integer, ForeignKey(Proficiency.id), nullable=False)
    proficiency = relationship(Proficiency)

    def __json__(self, request):
        return {'language': self.language, 'proficiency': self.proficiency}


class CandidateBookmarkEmployer(Base):
    __tablename__ = 'candidate_bookmark_employer'
    candidate_id = Column(GUID, ForeignKey('candidate.id'), primary_key=True)
    employer_id = Column(GUID, ForeignKey('employer.id'), primary_key=True)
    employer = relationship('Employer', backref='candidate_bookmarks')
    created = Column(DateTime, nullable=False, default=datetime.now, server_default=func.now())
    rejected = Column(DateTime, info=PRIVATE)

    def __init__(self, candidate=None, employer=None):
        self.candidate = candidate
        self.employer = employer


class SerializableBookmark(CandidateBookmarkEmployer):
    def __json__(self, request):
        return {'candidate': self.candidate, 'employer': self.employer, 'created': self.created}

class SerializableEmpBookmark(CandidateBookmarkEmployer):
    def __json__(self, request):
        return {'candidate': self.candidate, 'created': self.created}


class CandidateEmployerBlacklist(Base):
    __tablename__ = 'candidate_employer_blacklist'
    candidate_id = Column(GUID, ForeignKey('candidate.id'), primary_key=True)
    candidate = relationship('Candidate', backref='blacklist')

    employer_id = Column(GUID, ForeignKey('employer.id'), primary_key=True)
    employer = relationship('Employer')
    created = Column(DateTime, nullable=False, default=datetime.now, server_default=func.now())

    def __init__(self, candidate=None, employer=None):
        self.candidate = candidate
        self.employer = employer


class PreferredLocation(Base):
    __tablename__ = 'candidate_preferred_location'
    __table_args__ = (
        UniqueConstraint('candidate_id', 'country_iso',
                         name='candidate_preferred_location_country_unique'),
        UniqueConstraint('candidate_id', 'city_id', name='candidate_preferred_location_city_unique'),
        CheckConstraint('country_iso ISNULL and city_id NOTNULL or country_iso NOTNULL and city_id ISNULL',
                        name='candidate_preferred_location_has_some_fk'), )
    id = Column(Integer, primary_key=True)

    candidate_id = Column(GUID, ForeignKey('candidate.id'))
    country_iso = Column(String(2), ForeignKey(Country.iso), nullable=True)
    city_id = Column(Integer, ForeignKey('city.id'), nullable=True)
    city = relationship(City, lazy='joined')

    country = relationship(Country)

    def __repr__(self):
        return '<%s: country:%s city:%s>' % (self.__class__.__name__, self.country_iso, self.city_id)


def get_locations_from_structure(locations):
    if not locations:
        return []

    def identify(arg):
        c, l = arg
        return len(c) == 2 and (not l or (len(l) > 0 and not isinstance(l, basestring) and (isinstance(l, list))))

    srclist = filter(identify, locations.items())

    filters = []
    for country_iso, city_list in srclist:
        if city_list:
            filters.append(and_(City.country_iso == country_iso, City.name.in_(city_list)))

    lookup = {}
    if filters:
        cities = DBSession.query(City).filter(or_(*filters)).all()
        for city in cities:
            lookup.setdefault(city.country_iso, {})[city.name] = city

    locations = []
    for country_iso, city_list in srclist:
        if city_list:
            l = lookup[country_iso]
            for city_name in city_list:
                locations.append(PreferredLocation(city_id=l[city_name].id))
        else:
            locations.append(PreferredLocation(country_iso=country_iso))

    return locations


def locations_to_structure(locations, resolve_countries=False):
    if not locations:
        return None

    results = {}
    country_lookup = {}
    if resolve_countries:
        isos = [pl.country_iso or pl.city.country_iso for pl in locations]
        countries = DBSession.query(Country).filter(Country.iso.in_(isos)).all()
        country_lookup = {country.iso: country.name for country in countries}

    for pl in locations:
        if pl.country_iso:
            results.setdefault(country_lookup.get(pl.country_iso, pl.country_iso), [])
        elif pl.city_id:
            ciso = pl.city.country_iso
            results.setdefault(country_lookup.get(ciso, ciso), []).append(pl.city.name)
    return results


class TargetPosition(Base):
    __tablename__ = 'target_position'

    candidate_id = Column(GUID, ForeignKey("candidate.id"), primary_key=True)
    created = Column(DateTime, nullable=False, default=datetime.now)
    minimum_salary = Column(BigInteger)
    role_id = Column(Integer, ForeignKey('role.id'))
    role = relationship(Role)
    skills = relationship(Skill, secondary=target_position_skills)

    def __json__(self, request):
        return {'skills': self.skills, 'role': self.role, 'minimum_salary': self.minimum_salary}


class Candidate(Base, JsonSerialisable):
    __tablename__ = 'candidate'

    id = Column(GUID, default=uuid4, primary_key=True, info=PUBLIC)
    created = Column(DateTime, nullable=False, default=datetime.now, info=PRIVATE)
    last_login = Column(DateTime, info=PRIVATE)
    last_active = Column(DateTime, info=PRIVATE)
    anonymous = Column(Boolean, default=False, nullable=False, info=PUBLIC)
    pwdforgot_token = Column(GUID, unique=True, info=PRIVATE)
    pwdforgot_sent = Column(DateTime, info=PRIVATE)
    activation_token = Column(GUID, unique=True, default=uuid4, info=PRIVATE)
    activation_sent = Column(DateTime, info=PRIVATE)
    activated = Column(DateTime, info=PRIVATE)
    no_further_wxp = Column(DateTime, info=PRIVATE)
    no_further_edu = Column(DateTime, info=PRIVATE)

    email = Column(String(512), nullable=False, unique=True, info=PRIVATE)
    pwd = Column(String(128), nullable=False, info=PRIVATE)

    locale_id = Column(Integer, ForeignKey(Locale.id), nullable=False, server_default='1')
    locale = relationship(Locale)

    @property
    def lang(self):
        return self.locale.name


    first_name = Column(String(512), nullable=False, info=PUBLIC)
    last_name = Column(String(512), nullable=False, info=PUBLIC)
    picture_url = Column(String(1024), info=PUBLIC)
    dob = Column(Date, info=PUBLIC)
    pob = Column(String(512), info=PUBLIC)

    salutation_id = Column(Integer, ForeignKey(Salutation.id))
    salutation = relationship(Salutation, info=PUBLIC)

    github_url = Column(String(1024), info=PUBLIC)
    stackoverflow_url = Column(String(1024), info=PUBLIC)
    blog_url = Column(String(1024), info=PUBLIC)
    eu_work_visa = Column(Boolean, info=PUBLIC)
    cv_upload_url = Column(String(1024), info=PRIVATE)

    traffic_source_id = Column(Integer, ForeignKey(TrafficSource.id))
    traffic_source = relationship(TrafficSource)

    contact_line1 = Column(String(512), info=PUBLIC)
    contact_line2 = Column(String(512), info=PUBLIC)
    contact_line3 = Column(String(512), info=PUBLIC)
    contact_zipcode = Column(String(20), info=PUBLIC)
    location_id = Column(Integer, ForeignKey(City.id))
    location = relationship(City, info=PUBLIC)

    contact_phone = Column(String(128), info=PRIVATE)
    contact_skype = Column(String(128), info=PUBLIC)

    summary = Column(Text, info=PUBLIC)
    availability = Column(Text, info=PUBLIC)

    status_id = Column(Integer, ForeignKey(CandidateStatus.id), nullable=False)
    status = relationship(CandidateStatus)

    target_position = relationship(TargetPosition, backref='candidate', cascade='all, delete, delete-orphan',
                                   uselist=False)
    skills = relationship(CandidateSkill, backref='candidate', cascade='all, delete, delete-orphan')
    education = relationship(Education, backref='candidate', cascade='all, delete, delete-orphan',
                             order_by=Education.start.desc())
    languages = relationship(CandidateLanguage, backref='candidate', cascade='all, delete, delete-orphan',
                             order_by=CandidateLanguage.proficiency_id)

    work_experience = relationship(WorkExperience, backref='candidate', cascade='all, delete, delete-orphan',
                                   order_by=WorkExperience.start.desc())
    offers = relationship(CandidateOffer, backref='candidate', order_by=CandidateOffer.created.desc())

    preferred_locations = relationship(PreferredLocation)
    bookmarks = relationship('CandidateBookmarkEmployer', backref='candidate', cascade='all, delete, delete-orphan')
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
        self.pwd = hash_pwd(value)

    @property
    def is_active(self):
        return self.status == get_by_name_or_raise(CandidateStatus, CandidateStatus.ACTIVE)

    @property
    def can_login(self):
        return self.status.name not in [CandidateStatus.DELETED, CandidateStatus.SUSPENDED]

    @classmethod
    def not_deleted(cls):
        """
        Unified Login does not know about status, so need to filter those that are soft-deleted
        :return:
        """
        status = get_by_name_or_raise(CandidateStatus, CandidateStatus.DELETED)
        return [Candidate.status_id != status.id]


    @property
    def highest_level_skills(self):
        skills = sorted(self.skills, key=attrgetter('level_id'), reverse=True)
        if skills:
            highest_level = skills[0].level_id
            skills = filter(lambda s: s.level_id == highest_level, skills)
        return skills

    SUMMARY_GENERATOR = {
        'en': {
            'SUMMARY': u'{skills} looking for {role} position in {location}.',
            'EMPTY': u'No summary yet',
            'UNKNOWN_LEVEL': u'Candidate with skillsin {}',
            'CONJUNCTIVE': u'{} and {}'

        },
        'de': {
            'SUMMARY': u'{skills} sucht eine Stelle als {role} in {location}.',
            'EMPTY': u'Noch keine Selbstbeschreibung.',
            'UNKNOWN_LEVEL': u'Kandidat mit Fähigkeiten in {}',
            'CONJUNCTIVE': u'{} und {}'
        }
    }

    @property
    def generated_summary(self):
        generator = self.SUMMARY_GENERATOR[self.lang]

        skills = self.highest_level_skills
        locs = self.preferred_location

        if skills and self.target_position and locs:
            locations = []
            for country, cities in locs.items():
                if len(cities) > 0:
                    locations.append(u'%s (%s)' % (', '.join(cities), country))
                else:
                    locations.append(country)
            location_str = u' or '.join(locations)

            sample_skill = skills[0]
            if len(skills) > 1:
                skills[-2:] = [generator['CONJUNCTIVE'].format(skills[-2], skills[-1])]
            skill_str = u', '.join(unicode(s) for s in skills)

            if sample_skill.level:
                skills_string = sample_skill.level.name_as_subject(self.lang).format(skill_str)
            else:
                skills_string = generator['UNKNOWN_LEVEL'].format(skill_str)

            return generator['SUMMARY'].format(skills=skills_string, role=self.target_position.role,
                                               location=location_str)
        else:
            return generator['EMPTY']

    @property
    def preferred_location(self):
        return locations_to_structure(self.preferred_locations, resolve_countries=False)

    def obfuscate_result(self, result):
        result['first_name'] = ''
        result['last_name'] = str(self.id)[:13]
        result['picture_url'] = None
        return result

    def __json__(self, request):
        result = self.to_json(request)

        result['summary'] = self.summary or self.generated_summary
        result['salutation'] = self.salutation
        result['status'] = self.status
        result['languages'] = self.languages
        result['skills'] = self.skills
        result['preferred_location'] = self.preferred_location
        result['target_position'] = self.target_position
        result['location'] = self.location
        result['locale'] = self.locale

        display = get_request_role(request, self.id)
        if DISPLAY_ADMIN in display or DISPLAY_PRIVATE in display:
            result['traffic_source'] = self.traffic_source
            result['activation_token'] = self.activation_token
            result['activation_sent'] = self.activation_sent
            result['admin_comment'] = self.admin_comment
            result['invite_code'] = self.invite_code

        if EMPLOYER in request.effective_principals:
            cebl = CandidateEmployerBlacklist
            blacklist_count = DBSession.query(cebl).filter(cebl.candidate_id == self.id,
                                                           cebl.employer_id == request.employer_id).count()
            result['employer_blacklisted'] = blacklist_count > 0

            if not blacklist_count:
                cbe = CandidateBookmarkEmployer
                bookmark_count = DBSession.query(cbe).filter(cbe.candidate_id == self.id,
                                                             cbe.employer_id == request.employer_id).count()
                result['employer_bookmarked'] = bookmark_count > 0

            active_offers = DBSession.query(Offer.id).filter(Offer.candidate_id == self.id,
                                                             Offer.employer_id == request.employer_id,
                                                             Offer.by_active()).count()
            result['employer_has_offers'] = active_offers > 0
            accepted_count = DBSession.query(Offer.id).filter(Offer.candidate_id == self.id,
                                                              Offer.employer_id == request.employer_id,
                                                              Offer.has_accepted()).count()
            result['employer_has_accepted_offers'] = accepted_count > 0
            if accepted_count > 0:
                display.append(DISPLAY_PRIVATE)

            result['candidate_has_been_hired'] = self.status.name == CandidateStatus.SLEEPING

        if self.id == request.candidate_id:
            result['candidate_has_been_hired'] = self.status.name == CandidateStatus.SLEEPING

            result['is_approved'] = self.status.name in [CandidateStatus.ACTIVE, CandidateStatus.SLEEPING]
            result['is_activated'] = self.activated is not None

            result['pending_offers'] = DBSession.query(Offer.id).filter(Offer.candidate_id == self.id,
                                                                        *Offer.by_status(
                                                                            OFFER_STATUS_ACTIVE_KEY)).count()

        obfuscator = self.obfuscate_result if self.anonymous and display == [DISPLAY_ALWAYS] else None
        result.update(json_encoder(self, request, display, obfuscator))
        return result


class EmbeddedCandidate(Candidate):
    def __json__(self, request):
        result = {'first_name': self.first_name, 'last_name': self.last_name, 'id': self.id,
                  'picture_url': self.picture_url, 'skills': self.skills}

        display = get_request_role(request, self.id)
        do_obfuscate = self.anonymous and display == [DISPLAY_ALWAYS] and self.id != request.candidate_id


        if EMPLOYER in request.effective_principals:
            accepted_count = DBSession.query(Offer.id).filter(Offer.candidate_id == self.id,
                                                              Offer.employer_id == request.employer_id,
                                                              Offer.has_accepted()).count()
            do_obfuscate = do_obfuscate and accepted_count == 0

        return self.obfuscate_result(result) if do_obfuscate else result


class WXPCandidate(Candidate):
    def __json__(self, request):
        result = super(WXPCandidate, self).__json__(request)
        result['work_experience'] = self.work_experience
        return result


def sort_by_preferred_location(query, order_func):
    return query.outerjoin(TargetPosition).outerjoin(PreferredLocation) \
        .outerjoin(City, City.id == PreferredLocation.city_id) \
        .order_by(order_func(City.country_iso), order_func(City.name), order_func(PreferredLocation.country_iso))


def sort_by_salary(query, order_func):
    return query.join(TargetPosition).order_by(order_func(TargetPosition.minimum_salary))


def sort_by_target_position_role(query, order_func):
    return query.join(TargetPosition).join(Role).order_by(order_func(Role.name))


CANDIDATE_SORTABLES = {'id': Candidate.id,
                       'created': Candidate.created,
                       'name': [Candidate.first_name, Candidate.last_name],
                       'first_name': Candidate.first_name,
                       'last_name': Candidate.last_name,
                       'email': Candidate.email,
                       'minimum_salary': sort_by_salary,
                       'target_position_role': sort_by_target_position_role,
                       'preferred_location': sort_by_preferred_location}