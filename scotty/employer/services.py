from datetime import datetime
import hashlib
from sqlalchemy import text

from pyramid.httpexceptions import HTTPBadRequest

from scotty.candidate.models import Candidate, CandidateEmployerBlacklist, CandidateStatus, CandidateBookmarkEmployer

from scotty.models.meta import DBSession
from scotty.configuration.models import TrafficSource, Skill, Benefit, Role, Salutation, OfficeType, CompanyType
from scotty.employer.models import Employer, Office
from scotty.offer.models import EmployerOffer, Offer
from scotty.models.common import get_location_by_name_or_raise, get_by_name_or_create, \
    get_or_create_named_collection, get_by_name_or_raise
from scotty.services.pagingservice import Pager
from sqlalchemy.orm import joinedload


ID = lambda x: x

EMPLOYER_SIGNUP = {'company_name': ID, 'contact_salutation': lambda name: get_by_name_or_raise(Salutation, name),
                   'company_type': lambda name: get_by_name_or_raise(CompanyType, name),
                   'contact_first_name': ID, 'contact_last_name': ID, 'email': ID}


def employer_from_signup(params, lookup=EMPLOYER_SIGNUP):
    pwd = hashlib.sha256(params.pop('pwd')).hexdigest()
    employer = Employer(pwd=pwd)
    for field, transform in lookup.items():
        setattr(employer, field, transform(params[field]))
    return employer


def employer_from_login(params):
    email = params['email']
    pwd = hashlib.sha256(params['pwd']).hexdigest()
    employer = DBSession.query(Employer).filter(Employer.email == email, Employer.pwd == pwd).first()
    return employer


EMPLOYER_OFFICE = [
    ('contact_first_name', ID,),
    ('contact_last_name', ID),
    ('contact_phone', ID),
    ('contact_email', ID),
    ('contact_position', ID),
    ('website', ID),
    ('address_line1', ID),
    ('address_line2', ID),
    ('address_line3', ID),
    ('address_zipcode', ID),
    ('address_city', get_location_by_name_or_raise),
    ('contact_salutation', lambda name: get_by_name_or_raise(Salutation, name))
]


def add_employer_office(employer, params, lookup=EMPLOYER_OFFICE):
    office = Office()
    for field, transform in lookup:
        if field in params:
            setattr(office, field, transform(params[field]))
    if len(employer.offices) == 0:
        office.type = get_by_name_or_raise(OfficeType, 'HQ')

    office.employer_id = employer.id
    DBSession.add(office)
    DBSession.flush()
    return office


def set_employer_offices(employer, office_list, lookup=EMPLOYER_OFFICE):
    if not isinstance(office_list, list):
        raise HTTPBadRequest('Json must contain list of offices at root level.')
    DBSession.query(Office).filter(Office.employer_id == employer.id).delete()
    offices = []
    for params in office_list:
        office = Office()
        for field, transform in lookup:
            if field in params:
                setattr(office, field, transform(params[field]))
        if len(employer.offices) == 0:
            office.type = get_by_name_or_raise(OfficeType, 'HQ')

        office.employer_id = employer.id
        offices.append(office)
    DBSession.add_all(offices)
    DBSession.flush()
    return offices


def add_employer_offer(employer, params):
    candidate_id = params['candidate']['id']
    candidate = DBSession.query(Candidate).get(candidate_id)
    if not candidate:
        raise HTTPBadRequest("Unknown candidate")
    if not candidate.is_active:
        raise HTTPBadRequest("Candidate cannot receive offer, has is already %s!" % candidate.status)
    annual_salary = int(params['annual_salary'])
    location = get_location_by_name_or_raise(params['location'])

    if candidate.target_position.minimum_salary > annual_salary:
        raise HTTPBadRequest("Salary too low.")

    matches = DBSession.execute(text("""
        select count(distinct cpl.id)
        from  candidate_preferred_location cpl
        left join city
            on city.id = cpl.city_id,
        (
        select st_GeogFromText('SRID=4326;POINT(' || longitude || ' ' || latitude || ')') as g,
            country_iso
        from city 
        where id=:city_id
        ) cg
        where candidate_id =  :candidate_id
        and (ST_Distance(cg.g, city.geog) < 50000 or cpl.country_iso = cg.country_iso)
        limit 100;
    """), {'candidate_id': candidate_id, 'city_id': location.id})
    if sum([m[0] for m in matches]) == 0:
        raise HTTPBadRequest("Location unsuitable.")

    blacklisted = DBSession.query(CandidateEmployerBlacklist).filter(
        CandidateEmployerBlacklist.candidate_id == candidate_id) \
        .filter(CandidateEmployerBlacklist.employer_id == employer.id).count()
    if blacklisted > 0:
        raise HTTPBadRequest("Employer Blacklisted.")

    role = get_by_name_or_create(Role, params["role"])
    benefits = get_or_create_named_collection(Benefit, params['benefits'])
    techs = get_or_create_named_collection(Skill, params['technologies'])
    o = EmployerOffer(employer_id=employer.id, candidate_id=candidate.id, role=role, benefits=benefits,
                      technologies=techs, other_benefits=params.get('other_benefits'),
                      location=location, annual_salary=annual_salary, interview_details=params.get('interview_details'),
                      job_description=params.get('job_description'), message=params['message'])
    DBSession.add(o)
    DBSession.flush()
    return o


EMPLOYER_EDITABLES = {'company_name': ID, 'website': ID, 'address_line1': ID, 'address_line2': ID, 'address_line3': ID,
                      'address_zipcode': ID, 'address_city': get_location_by_name_or_raise, 'contact_first_name': ID,
                      'contact_last_name': ID, 'logo_url': ID, 'fb_url': ID, 'linkedin_url': ID, 'image_video_url': ID,
                      'mission_text': ID, 'culture_text': ID, 'vision_text': ID, 'founding_year': ID, 'revenue_pa': ID,
                      'funding_amount': ID, 'funding_text': ID, 'no_of_employees': ID, 'tech_team_size': ID,
                      'tech_team_philosophy': ID, 'recruitment_process': ID, 'training_policy': ID, 'admin_comment': ID,
                      'contact_salutation': lambda name: get_by_name_or_raise(Salutation, name),
                      'traffic_source': lambda name: get_by_name_or_create(TrafficSource, name),
                      'tech_tags': lambda tags: get_or_create_named_collection(Skill, tags),
                      'benefits': lambda tags: get_or_create_named_collection(Benefit, tags),
                      'other_benefits': ID}


def update_employer(obj, params, lookup=EMPLOYER_EDITABLES):
    for field, transform in lookup.items():
        if field in params:
            setattr(obj, field, transform(params[field]))


def get_employers_pager(tags, city_id, company_types):
    params = {'city_id': city_id}
    tags = {'tag_%d' % i: unicode(tag) for i, tag in enumerate(tags)}
    params.update(tags)
    if company_types:
        params['company_type'] = ', '.join([ct.name for ct in company_types])
        query = """select employer_id as id, matched_tags, count(*) over() as total
                   from employer_search(array[:%s], :city_id, array[:company_type])
                   order by array_length(matched_tags,1) desc""" % ',:'.join(tags.keys())

    else:
        query = """select employer_id as id, matched_tags, count(*) over() as total
                   from employer_search(array[:%s], :city_id, null)
                   order by array_length(matched_tags,1) desc""" % ',:'.join(tags.keys())
    return Pager(query, params)


def get_employer_suggested_candidate_ids(employer_id, limit=5):
    results = DBSession.execute(text("""
        select c.id as id, count(s.id) as noskills
            from employer e
            join employer_skill es
                on e.id = es.employer_id
            join skill s
                on s.id = es.skill_id
            join candidate_skill cs
                on  cs.skill_id = s.id
            join candidate c
                on cs.candidate_id = c.id
            join candidatestatus cstatus
                on c.status_id = cstatus.id
            where e.id = :employer_id
            and cstatus.name = 'active' and c.activated  is not null
            group by c.id
            order by noskills desc
            limit :limit
    """), {'employer_id': str(employer_id), 'limit': limit})

    # TODO: order results sometime
    return [r[0] for r in results]


def get_employer_newsfeed(employer):
    events = []
    now = datetime.utcnow()

    def recency(t):
        if not t:
            return None
        return (now - t).total_seconds()

    events.append({'name': 'SIGN_UP', 'recency': recency(employer.created), 'date': employer.created})
    events.append({'name': 'PROFILE_PENDING', 'recency': recency(employer.agreedTos), 'date': employer.agreedTos})
    events.append({'name': 'PROFILE_LIVE', 'recency': recency(employer.approved), 'date': employer.approved})

    bookmarks = DBSession.query(CandidateBookmarkEmployer).options(joinedload('candidate')) \
        .filter(CandidateBookmarkEmployer.employer_id == employer.id)

    for bm in bookmarks:
        events.append({'name': 'BOOKMARKED', 'recency': recency(bm.created), 'date': bm.created,
                       'candidate': bm.candidate})

    offers = DBSession.query(EmployerOffer).filter(EmployerOffer.employer_id == employer.id).options(joinedload("candidate")).all()
    for o in offers:
        events.append({'name': 'OFFER_SENT', 'recency': recency(o.created), 'date': o.created, 'candidate': o.candidate})
        events.append({'name': 'OFFER_ACCEPTED', 'recency': recency(o.accepted), 'date': o.accepted, 'candidate':
            o.candidate})
        events.append(
            {'name': 'OFFER_NEGOTIATION', 'recency': recency(o.contract_negotiation), 'date': o.contract_negotiation,
             'candidate': o.candidate})
        events.append({'name': 'OFFER_SIGNED', 'recency': recency(o.contract_signed), 'date': o.contract_signed,
                       'candidate': o.candidate})
        events.append({'name': 'OFFER_START_DATE', 'recency': recency(o.job_start_date), 'date': o.job_start_date,
                       'candidate': o.candidate})

    events_with_recency = filter(lambda x: x.get('recency'), events)
    return sorted(events_with_recency, key=lambda k: k['recency'])

