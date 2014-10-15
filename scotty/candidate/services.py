import hashlib

from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.candidate.models import FullCandidate, CandidateStatus, CandidateSkill, Candidate, CandidateLanguage, \
    WorkExperience, Education, TargetPosition, PreferredLocation, EDITABLES, work_experience_skill
from scotty.configuration.models import Skill, SkillLevel, Language, Proficiency, Company, Role, Degree, Institution, \
    Course
from scotty.employer.models import Employer
from scotty.models.common import get_by_name_or_raise, get_by_name_or_create, get_or_create_named_collection, \
    get_or_raise_named_collection, get_or_create_named_lookup, get_locations_from_structure
from scotty.offer.models import FullOffer
from scotty.services.pagingservice import Pager


def candidate_from_signup(params):
    status = get_by_name_or_raise(CandidateStatus, "active")
    candidate = FullCandidate(email=params['email'], first_name=params['first_name'], last_name=params['last_name'],
                              status=status)
    candidate.password = params['pwd']
    return candidate


def edit_candidate(candidate, params, editables=EDITABLES):
    for field in editables:
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


def set_candidate_education(candidate, params):
    candidate.education = []
    for edu in params:
        degree = get_by_name_or_create(Degree, edu.get('degree'))
        institution = get_by_name_or_create(Institution, edu['institution'])
        course = get_by_name_or_create(Course, edu['course'])
        start = edu['start']
        end = edu.get('end')
        if end and end < start:
            raise HTTPBadRequest('end must not be smaller than start')
        education = Education(institution=institution, degree=degree, start=start, end=end, course=course)
        candidate.education.append(education)

    DBSession.flush()
    return candidate.education


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


def set_candidate_work_experiences(candidate, params):
    candidate.work_experience = []
    for wxp_params in params:
        start = wxp_params['start']
        end = wxp_params.get('end')
        if end and end < start:
            raise HTTPBadRequest('end must not be smaller than start')
        summary = wxp_params.get('summary')
        role = get_by_name_or_create(Role, wxp_params.get("role"))
        company = get_by_name_or_create(Company, wxp_params['company'])
        skills = get_or_create_named_collection(Skill, wxp_params.get('skills'))
        wexp = WorkExperience(company=company, start=start, end=end, summary=summary, country_iso=wxp_params.get('country_iso'),
                              city=wxp_params.get('city'), role=role, skills=skills)
        candidate.work_experience.append(wexp)
    DBSession.flush()
    return candidate.work_experience


def set_target_position(candidate, params):
    if params:
        minimum_salary = params['minimum_salary']
        role = get_by_name_or_create(Role, params["role"])
        skills = get_or_create_named_collection(Skill, params["skills"])
        tp = TargetPosition(minimum_salary=minimum_salary, role=role, skills=skills)
    else:
        tp = None
    candidate.target_position = tp
    DBSession.flush()
    return candidate.target_position


def set_languages_on_candidate(candidate, params):
    if not isinstance(params, list):
        raise HTTPBadRequest("Must submit list of languages as root level.")
    language_lookup = get_or_raise_named_collection(Language, [p['language'] for p in params])
    proficiency_lookup = get_or_raise_named_collection(Proficiency, [p['proficiency'] for p in params],
                                                       require_uniqueness=False)
    DBSession.query(CandidateLanguage).filter(CandidateLanguage.candidate_id == candidate.id).delete()
    languages = []
    for p in params:
        languages.append(CandidateLanguage(candidate_id=candidate.id, language_id=language_lookup[p['language']].id,
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
        skills.append(CandidateSkill(candidate_id=candidate.id, skill=skill_lookup[p['skill']],
                                     level=level_lookup.get(p.get('level'))))
    DBSession.add_all(skills)
    DBSession.flush()
    return candidate


def get_candidates_by_techtags_pager(tags, city_id):
    params = {'city_id': city_id}
    tags = {'tag_%d' % i: tag for i, tag in enumerate(tags)}
    params.update(tags)
    query = """select candidate_id as id, matched_tags,
                  count(*) over() as total from
                  candidate_search(array[:%s], :city_id )
                  order by array_length(matched_tags,1) desc""" % ',:'.join(tags.keys())
    return Pager(query, params)


def get_candidate_newsfeed(c):
    candidate = DBSession.query(Candidate).filter(Candidate.id == c.id).first()

    events = []
    events.append({'name': 'SIGN_UP', 'date': candidate.created, 'note': 'Congrats you joined Scotty'})
    events.append({'name': 'PROFILE_PENDING', 'date': candidate.activation_sent, 'note': 'Your profile is done, just '
                                                                                         'waiting for you to click the activation email'})

    events.append({'name': 'PROFILE_LIVE', 'date': candidate.activated, 'note': 'Nicely done, you are now live and can start receiving great offers'})

    for o in candidate.offers:
        offer = DBSession.query(FullOffer).filter(offer.id == o.id).first()
        events.append({'name': 'OFFER_RECEIVED', 'date': offer.created, 'note': ('Awesome, you received an interview offer from %s', offer.employer.company_name)})
        events.append({'name': 'OFFER_REJECTED', 'date': offer.rejected, 'note': ('You have turned down the offer from %s', offer.employer.company_name)})
        events.append({'name': 'OFFER_ACCEPTED', 'date': offer.accepted, 'note': ('Brilliant you have accepted an interview with  %s', offer.employer.company_name)})
        events.append({'name': 'OFFER_NEGOCIATION', 'date': offer.contract_negotiation, 'note': (
            'Nearly there you have started negociating the details with %s', offer.employer.company_name)})
        events.append({'name': 'OFFER_SIGNED', 'date': offer.contract_signed, 'note': (
            'Winning! you have signed a contract with  %s and will receive you golden handshake soon', offer.employer.company_name)})
        events.append({'name': 'OFFER_START_DATE', 'date': offer.job_start_date, 'note': (
            'Good luck! you have set a start date of %s with %s', offer.job_start_date, offer.employer.company_name)})

    for b in candidate.bookmarked_employers:
        employer = DBSession.query(Employer).filter(employer.id == b.employer_id).first()
        events.append({'name': 'BOOKMARKED_EMPLOYER', 'date': offer.created, 'note': (
            'You liked %s they have been notified and should get in touch', offer.employer.company_name)})

    for b in candidate.blacklisted_employers:
        employer = DBSession.query(Employer).filter(employer.id == b.employer_id).first()
        events.append({'name': 'BOOKMARKED_EMPLOYER', 'date': offer.created, 'note': (
            'You liked %s they have been notified and should get in touch', offer.employer.company_name)})

    return sorted(events, key=lambda k: k['date'], reverse=True)

