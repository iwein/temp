import hashlib

from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.models import Candidate, CandidateStatus, Skill, SkillLevel, CandidateSkill, Degree, Institution, \
    Education, Company, WorkExperience, Role, City, TargetPosition, CompanyType, Proficiency, \
    Language, Seniority, CandidateLanguage, Course, FullCandidate
from scotty.services.common import get_by_name_or_raise, get_by_name_or_create, get_or_create_named_collection, get_or_raise_named_collection, get_location_by_name_or_create, \
    get_or_create_named_lookup
from sqlalchemy import text
from sqlalchemy.orm import joinedload


def candidate_from_signup(params):
    pwd = hashlib.sha256(params['pwd']).hexdigest()

    status = get_by_name_or_raise(CandidateStatus, "active")
    candidate = FullCandidate(email=params['email'], pwd=pwd, first_name=params['first_name'], last_name=params['last_name'],
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
    candidate = DBSession.query(FullCandidate).filter(Candidate.email == email, Candidate.pwd == pwd).first()
    return candidate


def add_candidate_skill(candidate, params):
    level_name = params['level']
    level = get_by_name_or_raise(SkillLevel, level_name)
    skill = get_by_name_or_create(Skill, params['name'])
    cskill = CandidateSkill(candidate_id=candidate.id, skill=skill, level=level)
    DBSession.add(cskill)
    DBSession.flush()
    return cskill


def add_candidate_education(candidate, params):
    degree = get_by_name_or_raise(Degree, params['degree'])
    institution = get_by_name_or_create(Institution, params['institution'])
    course = get_by_name_or_create(Course, params['course'])

    start = params['start']
    end = params.get('end')

    education = Education(candidate_id=candidate.id, institution=institution, degree=degree, start=start, end=end,
                          course=course)
    DBSession.add(education)
    DBSession.flush()
    return education


def add_candidate_work_experience(candidate, params):
    start = params['start']
    end = params.get('end')
    summary = params['summary']

    role = get_by_name_or_create(Role, params["role"])
    city = get_location_by_name_or_create(params['location'])
    company = get_by_name_or_create(Company, params['company'])
    skills = get_or_create_named_collection(Skill, params.get('skills'))

    wexp = WorkExperience(candidate_id=candidate.id, start=start, end=end, summary=summary, location=city,
                          company=company, role=role, skills=skills)
    DBSession.add(wexp)
    DBSession.flush()
    return wexp


def add_target_position(candidate, params):
    minimum_salary = params['minimum_salary']
    benefits = params.get('benefits')

    company_types = get_or_raise_named_collection(CompanyType, params['company_types']).values()

    seniority_name = params.get('seniority')

    role = get_by_name_or_create(Role, params["role"])
    skill = get_by_name_or_create(Skill, params["skill"])

    tp = TargetPosition(candidate_id=candidate.id, minimum_salary=minimum_salary, benefits=benefits,
                        company_types=company_types, role=role, skill=skill)
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
    if not params:
        cities = []
    elif isinstance(params, dict):
        candidate.dont_care_location = params['dont_care_location']
        cities = []
    elif isinstance(params, list):
        cities = DBSession.query(City).options(joinedload("country")).filter(
            City.name.in_(p['city'] for p in params),
            City.country_iso.in_(p['country_iso'] for p in params)
        ).all()

        if len(cities) < len(params):
            cities = [(c.name, c.country_iso) for c in cities]
            raise HTTPBadRequest("Unknown Locations Submitted: " % [l for l in params
                                                                    if (l['city'], l['country_iso']) not in cities])
    else:
        raise HTTPBadRequest("Must submit list of locations as root level.")
    candidate.preferred_cities = cities
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
        skills.append(CandidateSkill(candidate_id=candidate.id,
                                     skill=skill_lookup[p['skill']],
                                     level=level_lookup[p['level']]))
    DBSession.add_all(skills)
    DBSession.flush()
    return candidate

def get_candidates_by_techtags(tags):
    params = {'tag_%d' % i: tag.lower() for i, tag in enumerate(tags)}

    query = DBSession.execute(
        text("""
            select c.id as id,
              count(s.id) as noskills,
              array_agg(s.name) as matched_tags
            from candidate c
            join candidate_skill cs
              on c.id = cs.candidate_id
            join skill s
              on s.id = cs.skill_id
            where c.activated is not null and lower(s.name) in (%s)
            group by c.id
            order by noskills desc
            limit 20
        """ % ','.join(':%s' % k for k in params.keys())), params)

    results = list(query)
    return {r['id']: r['matched_tags'] for r in results}
