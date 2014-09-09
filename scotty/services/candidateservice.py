import hashlib

from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.models import Candidate, CandidateStatus, Skill, SkillLevel, CandidateSkill, Degree, Institution, \
    Education, Company, JobTitle, WorkExperience, Role, City, TargetPosition, CompanyType, Proficiency, \
    Language, Seniority, CandidateLanguage, Course
from scotty.services.common import get_by_name_or_raise, get_by_name_or_create, params_get_list_or_raise, \
    get_or_create_named_collection, get_or_raise_named_collection, get_location_by_name_or_create, \
    get_or_create_named_lookup
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload


def candidate_from_signup(params):
    pwd = hashlib.sha256(params['pwd']).hexdigest()

    status = get_by_name_or_raise(CandidateStatus, "active")
    candidate = Candidate(email=params['email'], pwd=pwd, first_name=params['first_name'], last_name=params['last_name'],
                          status=status)
    return candidate


def edit_candidate(candidate, params):
    for field in candidate.__editable__:
        if field in params:
            setattr(candidate, field, params[field])

    if 'contact_city' in params:
        candidate.contact_city = get_location_by_name_or_create(params['contact_city'])

    return candidate


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
    degree = get_by_name_or_raise(Degree, params['degree'])
    institution = get_by_name_or_create(Institution, params['institution'])
    course = get_by_name_or_create(Course, params['course'])

    start = params['start']
    end = params.get('end')

    education = Education(institution=institution, degree=degree, candidate=candidate, start=start, end=end,
                          course=course)
    DBSession.flush()
    return education


def add_candidate_work_experience(candidate, params):
    start = params['start']
    end = params.get('end')
    summary = params['summary']

    job_title = get_by_name_or_create(JobTitle, params["job_title"])
    role = get_by_name_or_create(Role, params["role"])
    city = get_location_by_name_or_create(params['location'])
    company = get_by_name_or_create(Company, params['company'])
    skills = get_or_create_named_collection(Skill, params.get('skills'))

    wexp = WorkExperience(start=start, end=end, summary=summary, candidate=candidate, location=city, company=company,
                          job_title=job_title, role=role, skills=skills)
    DBSession.add(wexp)
    DBSession.flush()
    return wexp


def add_candidate_target_position(candidate, params):
    minimum_salary = params['minimum_salary']
    benefits = params.get('benefits')

    company_type_name = params.get('company_type')
    company_type = get_by_name_or_raise(CompanyType, company_type_name)

    seniority_name = params.get('seniority')

    role = get_by_name_or_create(Role, params["role"])
    skill = get_by_name_or_create(Skill, params["skill"])

    tp = TargetPosition(candidate=candidate, minimum_salary=minimum_salary, benefits=benefits,
                        company_type=company_type, role=role, skill=skill)
    if seniority_name:
        seniority = get_by_name_or_raise(Seniority, seniority_name)
        tp.seniority = seniority

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

    if not params:
        cities = []
    else:
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
    skill_lookup = get_or_create_named_lookup(Skill, [p['skill'] for p in params])
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