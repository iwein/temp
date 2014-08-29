from collections import Counter
import hashlib
from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.models import Candidate, CandidateStatus, Skill, SkillLevel, CandidateSkill, EducationDegree, Institution, \
    CandidateEducation, Company, JobTitle, WorkExperience, Role, City, TargetPosition, CompanyType, Proficiency, \
    Language, Seniority, CandidateLanguage, candidate_preferred_cities
from sqlalchemy import func
from sqlalchemy.orm import joinedload

__author__ = 'Martin'


def get_by_name_or_raise(cls, name):
    obj = DBSession.query(cls).filter(cls.name == name).first()
    if not obj:
        raise HTTPBadRequest("Unknown %s" % cls.__name__)
    return obj


def get_by_name_or_create(cls, name):
    obj = DBSession.query(cls).filter(cls.name == name).first()
    if not obj:
        obj = cls(name=name)
        DBSession.add(obj)
    return obj


def params_get_list_or_raise(params, name):
    names = params.get(name, [])
    if names and not isinstance(names, list):
        raise HTTPBadRequest("%s must be list of string." % name)
    return names


def get_or_create_named_collection(cls, names, field_name='name'):
    objs = DBSession.query(cls).filter(getattr(cls, field_name).in_(names)).all()
    if len(objs) < len(names):
        missings = set(names).difference(getattr(t, field_name) for t in objs)
        new_objs = [cls(**{field_name: m}) for m in missings]
        DBSession.add_all(new_objs)
        objs = objs.append(new_objs)
    return objs or []


def get_or_raise_named_collection(cls, names, field_name='name', require_uniqueness=True):
    name_set = set(names)
    if require_uniqueness:
        if len(name_set) < len(names):
            duplicates = [x for x, y in Counter(names).items() if y > 1]
            raise HTTPBadRequest("Duplicate items submitted: %s" % duplicates)

    objs = DBSession.query(cls).filter(getattr(cls, field_name).in_(name_set)).all()
    if len(objs) < len(name_set):
        missings = set(name_set).difference(getattr(t, field_name) for t in objs)
        raise HTTPBadRequest("Unknown %s: %s" %(cls.__name__, missings))
    return {o.name: o for o in objs}



def candidate_from_signup(params):
    pwd = hashlib.sha256(params['pwd']).hexdigest()

    status = get_by_name_or_raise(CandidateStatus, "active")
    return Candidate(email=params['email'], pwd=pwd, first_name=params['first_name'], last_name=params['last_name'],
                     status=status)


def candidate_from_login(params):
    email = params['email']
    pwd = hashlib.sha256(params['pwd']).hexdigest()
    candidate = DBSession.query(Candidate).filter(Candidate.email == email, Candidate.pwd == pwd).first()
    return candidate


def add_candidate_skill(candidate, params):
    level_name = params['level']
    level = get_by_name_or_raise(SkillLevel, level_name)
    skill = get_by_name_or_create(Skill, params['name'])

    cskill = CandidateSkill(skill=skill, level=level, candidate=candidate)

    DBSession.flush()
    return cskill


def add_candidate_education(candidate, params):
    degree_name = params['degree']

    degree = get_by_name_or_raise(EducationDegree, degree_name)
    institution = get_by_name_or_create(Institution, params['institution'])

    start = params['start']
    end = params['end']
    course = params['course']

    education = CandidateEducation(institution=institution, degree=degree, candidate=candidate, start=start, end=end,
                                   course=course)
    DBSession.flush()
    return education


def add_candidate_work_experience(candidate, params):
    start = params['start']
    end = params['end']
    summary = params['summary']

    title_names = params_get_list_or_raise(params, "job_titles")
    job_titles = get_or_create_named_collection(JobTitle, title_names)

    role_names = params_get_list_or_raise(params, "roles")
    roles = get_or_create_named_collection(Role, role_names)

    location = params['location']
    city = DBSession.query(City).filter(City.name == location['city'], City.country_iso == location['country_iso']).first()
    if not city:
        city = City(name=location['city'], country_iso=location['city'])
        DBSession.add(city)

    company = get_by_name_or_create(Company, params['company'])

    wexp = WorkExperience(start=start, end=end, summary=summary, candidate=candidate, location=city, company=company)
    DBSession.add(wexp)
    DBSession.flush()
    wexp.roles = roles
    wexp.job_titles = job_titles
    DBSession.flush()
    return wexp


def add_candidate_target_position(candidate, params):
    minimum_salary = params['minimum_salary']
    benefits = params.get('benefits')

    company_type_name = params.get('company_type')
    company_type = get_by_name_or_raise(CompanyType, company_type_name)

    seniority_name = params['seniority']
    seniority = get_by_name_or_raise(Seniority, seniority_name)

    role_names = params_get_list_or_raise(params, "roles")
    roles = get_or_create_named_collection(Role, role_names)

    skill_names = params_get_list_or_raise(params, "skills")
    skills = get_or_create_named_collection(Skill, skill_names)

    tp = TargetPosition(candidate=candidate, minimum_salary=minimum_salary, benefits=benefits,
                        company_type=company_type, seniority=seniority, roles=roles, skills=skills)
    DBSession.add(tp)
    DBSession.flush()
    return tp


def set_languages_on_candidate(candidate, params):
    if not isinstance(params, list):
        raise HTTPBadRequest("Must submit list of languages as root level.")
    language_lookup = get_or_raise_named_collection(Language, [p['language'] for p in params])
    proficiency_lookup = get_or_raise_named_collection(Proficiency, [p['proficiency'] for p in params],
                                                       require_uniqueness=False)
    DBSession.query(CandidateLanguage).filter(CandidateLanguage.candidate_id == candidate.id).delete()
    languages = []
    for p in params:
        languages.append(CandidateLanguage(candidate_id=candidate.id,
                                           language_id=language_lookup[p['language']].id,
                                           proficiency_id=proficiency_lookup[p['proficiency']].id))
    DBSession.add_all(languages)
    DBSession.flush()
    return candidate


def set_preferredcities_on_candidate(candidate, params):
    if not isinstance(params, list):
        raise HTTPBadRequest("Must submit list of locations as root level.")

    cities = DBSession.query(City).options(joinedload("country")).filter(
        City.name.in_(p['city'] for p in params),
        City.country_iso.in_(p['country_iso'] for p in params)
    ).all()

    if len(cities) < len(params):
        cities = [(c.name, c.country_iso) for c in cities]
        raise HTTPBadRequest("Unknown Locations Submitted: " % [l for l in params
                                                                if (l['city'], l['country_iso']) not in cities])
    Candidate.preferred_cities = [c.id for c in cities]
    DBSession.flush()
    return candidate


def set_skills_on_candidate(candidate, params):
    if not isinstance(params, list):
        raise HTTPBadRequest("Must submit list of skills as root level.")
    skill_lookup = get_or_raise_named_collection(Skill, [p['skill'] for p in params])
    level_lookup = get_or_raise_named_collection(SkillLevel, [p['level'] for p in params],
                                                 require_uniqueness=False)

    DBSession.query(CandidateSkill).filter(CandidateSkill.candidate_id == candidate.id).delete()
    skills = []
    for p in params:
        skills.append(CandidateSkill(candidate=candidate,
                                     skill=skill_lookup[p['skill']],
                                     level=level_lookup[p['level']]))
    DBSession.add_all(skills)
    DBSession.flush()
    return candidate