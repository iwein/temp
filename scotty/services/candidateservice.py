import hashlib
from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.models import Candidate, CandidateStatus, Skill, SkillLevel, CandidateSkill, EducationDegree, Institution, \
    CandidateEducation, Company, JobTitle, WorkExperience, Role, City

__author__ = 'Martin'


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
    level = DBSession.query(SkillLevel).filter(SkillLevel.name == level_name).first()
    if not level:
        raise HTTPBadRequest("Unknown Skill Level")

    skill_name = params['name']
    skill = DBSession.query(Skill).filter(Skill.name == skill_name).first()
    if not skill:
        skill = Skill(name=skill_name)
        DBSession.add(skill)

    cskill = CandidateSkill(skill=skill, level=level, candidate=candidate)

    DBSession.flush()
    return cskill


def add_candidate_education(candidate, params):

    degree_name = params['degree']
    degree = DBSession.query(EducationDegree).filter(EducationDegree.name == degree_name).first()
    if not degree:
        raise HTTPBadRequest("Unknown Education Degree")

    institution_name = params['institution']
    institution = DBSession.query(Institution).filter(Institution.name == institution_name).first()
    if not institution:
        institution = Institution(name=institution_name)
        DBSession.add(institution)

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

    company_name = params['company']
    company = DBSession.query(Company).filter(Company.name == company_name).first()
    if not company:
        company = Company(name=company_name)
        DBSession.add(company)

    wexp = WorkExperience(start=start, end=end, summary=summary, candidate=candidate, location=city,
                          company=company)
    DBSession.add(wexp)
    DBSession.flush()
    wexp.roles = roles
    wexp.job_titles = job_titles
    DBSession.flush()
    return wexp