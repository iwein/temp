from collections import OrderedDict
import hashlib
from pyramid.httpexceptions import HTTPBadRequest
from scotty.candidate.models import Candidate, candidate_employer_blacklist

from scotty.models.meta import DBSession
from scotty.configuration.models import TrafficSource, Skill, Benefit, Role, Salutation, OfficeType, CompanyType
from scotty.employer.models import Employer, Office
from scotty.offer.models import EmployerOffer
from scotty.models.common import get_location_by_name_or_create, get_location_by_name_or_raise, get_by_name_or_create, \
    get_or_create_named_collection, get_by_name_or_raise
from sqlalchemy import text, func


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
    ('contact_last_name',  ID),
    ('contact_phone',  ID),
    ('contact_email',  ID),
    ('contact_position',  ID),
    ('website',  ID),
    ('address_line1',  ID),
    ('address_line2',  ID),
    ('address_line3',  ID),
    ('address_zipcode',  ID),
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

    office.employer_id=employer.id
    DBSession.add(office)
    DBSession.flush()
    return office


def add_employer_offer(employer, params):
    candidate_id = params['candidate']['id']
    candidate = DBSession.query(Candidate).get(candidate_id)
    if not candidate:
        raise HTTPBadRequest("Unknown candidate")
    annual_salary = int(params['annual_salary'])
    location = get_location_by_name_or_raise(params['location'])
    for tp in candidate.target_positions:
        if tp.minimum_salary > annual_salary:
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

    blacklisted = DBSession.query(candidate_employer_blacklist).filter(candidate_employer_blacklist.c.candidate_id == candidate_id) \
        .filter(candidate_employer_blacklist.c.employer_id == employer.id).count()
    if blacklisted > 0:
        raise HTTPBadRequest("Employer Blacklisted.")

    role = get_by_name_or_create(Role, params["role"])
    benefits = get_or_create_named_collection(Benefit, params['benefits'])
    techs = get_or_create_named_collection(Skill, params['technologies'])
    o = EmployerOffer(employer_id=employer.id, candidate_id=candidate.id, role=role, benefits=benefits, technologies=techs,
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
                      'tech_team_philosophy': ID, 'recruitment_process': ID, 'training_policy': ID,
                      'contact_salutation': lambda name: get_by_name_or_raise(Salutation, name),
                      'traffic_source': lambda name: get_by_name_or_create(TrafficSource, name),
                      'tech_tags': lambda tags: get_or_create_named_collection(Skill, tags),
                      'benefits': lambda tags: get_or_create_named_collection(Benefit, tags)}


def update_employer(obj, params, lookup=EMPLOYER_EDITABLES):
    for field, transform in lookup.items():
        if field in params:
            setattr(obj, field, transform(params[field]))


def search_employers(tags, city_id, company_types):
    params = {'city_id': city_id}
    tags = {'tag_%d' % i: tag for i, tag in enumerate(tags)}
    params.update(tags)
    if company_types:
        params['company_type'] = ', '.join([ct.name for ct in company_types])
        query = DBSession.execute(text(
            """select * from employer_search(array[:%s], :city_id, array[:company_type]) order by array_length(matched_tags,1) desc""" % ',:'.join(tags.keys())),
                                  params)
    else:
        query = DBSession.execute(text(
            """select * from employer_search(array[:%s], :city_id, null) order by array_length(matched_tags,1) desc""" % ',:'.join(tags.keys())), params)
    results = list(query)
    return [(r['employer_id'], r['matched_tags']) for r in results]


def get_employer_suggested_candidate_ids(employer_id):
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
            where e.id = :employer_id
            group by c.id
            order by noskills desc
    """), {'employer_id': str(employer_id)})

    # TODO: order results sometime
    return [r[0] for r in results]


