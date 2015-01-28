from datetime import datetime

from pyramid.httpexceptions import HTTPBadRequest
from scotty.models.tools import ID
from scotty.services import hash_pwd
from sqlalchemy.orm import joinedload_all
from scotty.models.meta import DBSession
from scotty.candidate.models import FullCandidate, CandidateStatus, CandidateSkill, Candidate, CandidateLanguage, \
    WorkExperience, Education, PreferredLocation
from scotty.configuration.models import Skill, SkillLevel, Language, Proficiency, Role
from scotty.models.common import get_by_name_or_raise, get_by_name_or_create, get_or_create_named_collection, \
    get_or_raise_named_collection, get_or_create_named_lookup, get_location_by_name_or_raise
from scotty.offer.models import NewsfeedOffer
from scotty.services.pagingservice import Pager


def candidate_from_signup(candidate_id, params):
    status = get_by_name_or_raise(CandidateStatus, CandidateStatus.PENDING)
    candidate = FullCandidate(id=candidate_id, email=params['email'], first_name=params['first_name'],
                              last_name=params['last_name'],
                              status=status, invite_code=params.get('invite_code'))
    candidate.password = params['pwd']
    return candidate


CANDIDATE_EDITABLES = {'first_name': ID, 'last_name': ID, 'pob': ID, 'dob': ID, 'picture_url': ID, 'salutation': ID,
                       'anonymous': ID,
                       'admin_comment': ID, 'contact_line1': ID, 'contact_line2': ID, 'contact_line3': ID,
                       'contact_zipcode': ID,
                       'location': get_location_by_name_or_raise, 'contact_phone': ID, 'availability': ID,
                       'summary': ID,
                       'github_url': ID, 'stackoverflow_url': ID, 'blog_url': ID, 'contact_skype': ID,
                       'eu_work_visa': ID, 'cv_upload_url': ID}

TP_EDITABLES = {'minimum_salary': ID, 'role': lambda v: get_by_name_or_create(Role, v),
                'skills': lambda v: get_or_create_named_collection(Skill, v)}


def candidate_from_login(params):
    email = params['email']
    pwd = hash_pwd(params['pwd'])
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


def set_candidate_education(candidate_id, params):
    educations = []
    for edu in params:
        education = Education(candidate_id=candidate_id,
                              institution=edu['institution'],
                              degree=edu['degree'],
                              start=edu['start'],
                              end=edu['end'],
                              course=edu['course'])
        educations.append(education)
    DBSession.add_all(educations)
    DBSession.flush()
    return educations


def set_candidate_work_experiences(candidate_id, params):
    experiences = []
    for wxp_params in params:
        wexp = WorkExperience(candidate_id=candidate_id,
                              **{k: wxp_params.get(k) for k in ['start', 'end', 'summary', 'country_iso', 'city',
                                                                'company', 'role', 'skills']})
        experiences.append(wexp)
    DBSession.add_all(experiences)
    DBSession.flush()
    return experiences


def set_preferred_locations(candidate_id, locations):
    DBSession.query(PreferredLocation).filter(PreferredLocation.target_position_candidate_id == candidate_id).delete()
    for loc in locations:
        loc.target_position_candidate_id = candidate_id
    DBSession.add_all(locations)
    DBSession.flush()
    return locations


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


def candidate_fulltext_search(terms, employer_id, offset, limit):
    query = "select candidate_id as id, status, count(*) over() as total " \
            "from cn_candidate_search(:query, :employer_id) limit :limit"
    params = {'offset': offset, 'limit': limit, 'query': terms.replace(' ', '&'),
              'employer_id': str(employer_id) if employer_id else None}
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
        events.append({'name': 'BOOKMARKED_EMPLOYER', 'recency': recency(bookmark.created), 'date': bookmark.created,
                       'employer': bookmark.employer})

    # this is same as offer rejection timewise
    # for blacklisted in candidate.blacklist:
    #    events.append({'name': 'BLACKLISTED_EMPLOYER', 'recency': recency(blacklisted.created),
    #                   'date': blacklisted.created, 'employer': blacklisted.employer})

    events_with_recency = filter(lambda x: x.get('recency'), events)
    return sorted(events_with_recency, key=lambda k: k['recency'])
