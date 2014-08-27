import hashlib
from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.models import Candidate, CandidateStatus, Skill, SkillLevel, CandidateSkill

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