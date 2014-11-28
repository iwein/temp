from datetime import datetime
import hashlib

from pyramid.httpexceptions import HTTPBadRequest
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload_all

from scotty import DBSession
from scotty.candidate.models import FullCandidate, CandidateStatus, CandidateSkill, Candidate, CandidateLanguage, \
    WorkExperience, Education, TargetPosition, PreferredLocation, InviteCode
from scotty.configuration.models import Skill, SkillLevel, Language, Proficiency, Company, Role, Degree, Institution, \
    Course, City
from scotty.models.common import get_by_name_or_raise, get_by_name_or_create, get_or_create_named_collection, \
    get_or_raise_named_collection, get_or_create_named_lookup, get_location_by_name_or_raise
from scotty.offer.models import FullOffer, NewsfeedOffer
from scotty.services.pagingservice import Pager


def candidate_from_signup(params):
    status = get_by_name_or_raise(CandidateStatus, CandidateStatus.PENDING)
    invite_code = get_by_name_or_raise(InviteCode, params.get('invite_code'))
    candidate = FullCandidate(email=params['email'], first_name=params['first_name'], last_name=params['last_name'],
                              status=status, invite_code=invite_code)
    candidate.password = params['pwd']
    return candidate


ID = lambda x: x

EDITABLES = {'first_name': ID, 'last_name': ID, 'pob': ID, 'dob': ID, 'picture_url': ID, 'salutation': ID,
             'anonymous': ID,
             'admin_comment': ID, 'contact_line1': ID, 'contact_line2': ID, 'contact_line3': ID, 'contact_zipcode': ID,
             'location': get_location_by_name_or_raise, 'contact_phone': ID, 'availability': ID, 'summary': ID,
             'github_url': ID, 'stackoverflow_url': ID, 'contact_skype': ID, 'eu_work_visa': ID, 'cv_upload_url': ID}


def edit_candidate(candidate, params, editables=EDITABLES):
    for field, transform in editables.items():
        if field in params:
            setattr(candidate, field, transform(params[field]))
    return candidate


def candidate_from_login(params):
    email = params['email']
    pwd = hashlib.sha256(params['pwd']).hexdigest()
    candidate = DBSession.query(FullCandidate).filter(Candidate.email == email, Candidate.pwd == pwd) \
        .join(CandidateStatus).filter(CandidateStatus.name.notin_([CandidateStatus.DELETED,
                                                                   CandidateStatus.SUSPENDED])).first()
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
        start = edu['start']
        institution = get_by_name_or_create(Institution, edu['institution'])

        degree = get_by_name_or_create(Degree, edu.get('degree'))
        course = get_by_name_or_create(Course, edu.get('course'))
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
    summary = params.get('summary')

    role = get_by_name_or_create(Role, params.get("role"))

    company = get_by_name_or_create(Company, params['company'])
    skills = get_or_create_named_collection(Skill, params.get('skills'))

    wexp = WorkExperience(candidate_id=candidate.id, start=start, end=end, summary=summary,
                          country_iso=params.get('country_iso'), city=params.get('city'), company=company, role=role,
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
        wexp = WorkExperience(company=company, start=start, end=end, summary=summary,
                              country_iso=wxp_params.get('country_iso'),
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

    def get_level(p):
        return level_lookup.get(p['level']) if p.get('level') else None

    for p in params:
        skills.append(CandidateSkill(candidate_id=candidate.id, skill=skill_lookup[p['skill']], level=get_level(p)))
    DBSession.add_all(skills)
    DBSession.flush()
    return candidate


def get_candidates_by_techtags_pager(tags, city_id, status_id=1):
    params = {'city_id': city_id, 'status_id': status_id}
    tags = {'tag_%d' % i: tag for i, tag in enumerate(tags)}
    params.update(tags)
    query = """select candidate_id as id, matched_tags,
                  count(*) over() as total from
                  candidate_search(array[:%s], :city_id, :status_id)
                  order by array_length(matched_tags,1) desc""" % ',:'.join(tags.keys())
    return Pager(query, params)


def get_candidate_newsfeed(c):
    candidate = DBSession.query(Candidate).filter(Candidate.id == c.id).first()

    events = []
    now = datetime.utcnow()

    def recency(t):
        if not t:
            return None
        return (now - t).total_seconds()

    events.append({'name': 'SIGN_UP', 'recency': recency(candidate.created), 'date': candidate.created})
    events.append({'name': 'PROFILE_PENDING', 'recency': recency(candidate.activation_sent),
                   'date': candidate.activation_sent})
    events.append({'name': 'PROFILE_LIVE', 'recency': recency(candidate.activated), 'date': candidate.activated})

    offers = DBSession.query(NewsfeedOffer).filter(NewsfeedOffer.candidate_id == c.id).options(
        joinedload_all("employer.benefits"), joinedload_all("candidate.skills")).all()
    for o in offers:
        events.append({'name': 'OFFER_RECEIVED', 'recency': recency(o.created), 'date': o.created, 'offer': o})
        events.append({'name': 'OFFER_REJECTED', 'recency': recency(o.rejected), 'date': o.rejected, 'offer': o})
        events.append({'name': 'OFFER_ACCEPTED', 'recency': recency(o.accepted), 'date': o.accepted, 'offer': o})
        events.append({'name': 'OFFER_NEGOTIATION', 'recency': recency(o.contract_negotiation),
                       'date': o.contract_negotiation, 'offer': o})
        events.append(
            {'name': 'OFFER_SIGNED', 'recency': recency(o.contract_signed), 'date': o.contract_signed, 'offer': o})
        events.append(
            {'name': 'OFFER_START_DATE', 'recency': recency(o.job_start_date), 'date': o.job_start_date, 'offer': o})
    for bookmark in candidate.bookmarks:
        events.append({'name': 'BOOKMARKED_EMPLOYER', 'recency': recency(bookmark.created), 'date': bookmark.created})
    for blacklisted in candidate.blacklist:
        events.append({'name': 'BOOKMARKED_EMPLOYER', 'recency': recency(blacklisted.created),
                       'date': blacklisted.created})

    events_with_recency = filter(lambda x: x.get('recency'), events)
    return sorted(events_with_recency, key=lambda k: k['recency'])

