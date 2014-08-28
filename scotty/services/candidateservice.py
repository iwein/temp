import hashlib
from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.models import Candidate, CandidateStatus, Skill, SkillLevel, CandidateSkill, EducationDegree, Institution, \
    CandidateEducation, Company, JobTitle, WorkExperience, Role, City, TargetPosition, CompanyType

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


def candidate_from_signup(params):
    pwd = hashlib.sha256(params['pwd']).hexdigest()

    status = DBSession.query(CandidateStatus).filter(CandidateStatus.name == "ACTIVE").first()

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

    education = CandidateEducation(institution=institution, degree=degree, candidate=candidate,
                                   start=start, end=end, course=course)
    DBSession.flush()
    return education


def get_list_or_raise(params, name):
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


def add_candidate_work_experience(candidate, params):
    start = params['start']
    end = params['end']
    summary = params['summary']

    title_names = get_list_or_raise(params, "job_titles")
    job_titles = get_or_create_named_collection(JobTitle, title_names)

    role_names = get_list_or_raise(params, "roles")
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

    level_name = params.get('level')
    level = get_by_name_or_raise(SkillLevel, level_name)

    role_names = get_list_or_raise(params, "roles")
    roles = get_or_create_named_collection(Role, role_names)

    skill_names = get_list_or_raise(params, "skills")
    skills = get_or_create_named_collection(Skill, skill_names)

    tp = TargetPosition(candidate=candidate, minimum_salary=minimum_salary, benefits=benefits,
                        company_type=company_type, level=level, roles=roles, skills=skills)
    DBSession.add(tp)
    DBSession.flush()
    return tp