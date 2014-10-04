from collections import OrderedDict
import hashlib

from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.candidate.models import FullCandidate, CandidateStatus, CandidateSkill, Candidate, CandidateLanguage, \
    WorkExperience, Education, TargetPosition, PreferredLocation
from scotty.configuration.models import Skill, SkillLevel, CompanyType, TravelWillingness, Language, Proficiency, \
    Company, Role, Degree, Institution, Course
from scotty.models.common import get_by_name_or_raise, get_by_name_or_create, get_or_create_named_collection, \
    get_or_raise_named_collection, get_or_create_named_lookup, \
    get_locations_from_structure
from sqlalchemy import text


def candidate_from_signup(params):
    status = get_by_name_or_raise(CandidateStatus, "active")
    candidate = FullCandidate(email=params['email'], first_name=params['first_name'], last_name=params['last_name'],
                              status=status)
    candidate.password = params['pwd']
    return candidate


def edit_candidate(candidate, params):
    for field in candidate.__editable__:
        if field in params:
            setattr(candidate, field, params[field])
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
    degree = get_by_name_or_create(Degree, params.get('degree'))
    institution = get_by_name_or_create(Institution, params['institution'])
    course = get_by_name_or_create(Course, params['course'])

    start = params['start']
    end = params.get('end')
    if end and end < start:
        raise HTTPBadRequest('end must not be smaller than start')

    education = Education(candidate_id=candidate.id, institution=institution, degree=degree, start=start, end=end,
                          course=course)
    DBSession.add(education)
    DBSession.flush()
    return education


def add_candidate_work_experience(candidate, params):
    start = params['start']
    end = params.get('end')
    if end and end < start:
        raise HTTPBadRequest('end must not be smaller than start')
    summary = params['summary']

    role = get_by_name_or_create(Role, params["role"])

    company = get_by_name_or_create(Company, params['company'])
    skills = get_or_create_named_collection(Skill, params.get('skills'))

    wexp = WorkExperience(candidate_id=candidate.id, start=start, end=end, summary=summary,
                          country_iso=params['country_iso'], city=params['city'], company=company, role=role,
                          skills=skills)
    DBSession.add(wexp)
    DBSession.flush()
    return wexp


def add_target_position(candidate, params):
    minimum_salary = params['minimum_salary']
    company_types = get_or_raise_named_collection(CompanyType, params['company_types']).values()
    travel_willingness = get_by_name_or_raise(TravelWillingness, params['travel_willingness'])
    relocate = params.get('relocate', False)

    role = get_by_name_or_create(Role, params["role"])
    skills = get_or_create_named_collection(Skill, params["skills"])

    tp = TargetPosition(candidate_id=candidate.id, minimum_salary=minimum_salary, company_types=company_types,
                        role=role, skills=skills, travel_willingness=travel_willingness, relocate=relocate)
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


def set_preferredlocations_on_candidate(candidate, params):
    if isinstance(params, dict):
        try:
            DBSession.query(PreferredLocation).filter(PreferredLocation.candidate_id == candidate.id).delete()
            locations = get_locations_from_structure(params)
            candidate.preferred_locations = locations
            DBSession.flush()
            return candidate
        except (IndexError, KeyError), e:
            raise HTTPBadRequest("Unknown Locations Submitted: %s" % e)
    else:
        raise HTTPBadRequest("Must submit dictionary of countries with city lists as root level.")


def set_skills_on_candidate(candidate, params):
    if not isinstance(params, list):
        raise HTTPBadRequest("Must submit list of skills as root level.")
    skill_lookup = get_or_create_named_lookup(Skill, [p['skill'] for p in params])
    level_lookup = get_or_raise_named_collection(SkillLevel, [p['level'] for p in params if p.get('level')],
                                                 require_uniqueness=False)

    DBSession.query(CandidateSkill).filter(CandidateSkill.candidate_id == candidate.id).delete()
    skills = []
    for p in params:
        skills.append(CandidateSkill(candidate_id=candidate.id,
                                     skill=skill_lookup[p['skill']],
                                     level=level_lookup.get(p.get('level'))))
    DBSession.add_all(skills)
    DBSession.flush()
    return candidate

def get_candidates_by_techtags(tags, city_id):
    params = {'city_id': city_id}
    tags = {'tag_%d' % i: tag for i, tag in enumerate(tags)}
    params.update(tags)

    query = DBSession.execute(
        text("""select * from candidate_search(array[:%s], :city_id ) order by array_length(matched_tags,1) desc""" % ',:'.join(tags.keys())), params)
    results = list(query)
    return [(r['candidate_id'], r['matched_tags']) for r in results]
