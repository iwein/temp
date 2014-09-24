import hashlib

from scotty.models.meta import DBSession
from scotty.configuration.models import TrafficSource, Skill, Benefit, Role, Salutation, OfficeType
from scotty.employer.models import employer_address_mapping, Employer, Office
from scotty.offer.models import EmployerOffer
from scotty.models.common import get_location_by_name_or_create, get_location_by_name_or_raise, get_by_name_or_create, \
    get_or_create_named_collection, get_by_name_or_raise
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError


ID = lambda x: x

EMPLOYER_SIGNUP = {'company_name': ID, 'contact_salutation': lambda name: get_by_name_or_raise(Salutation, name),
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
    candidate = params['candidate']
    role = get_by_name_or_create(Role, params["role"])
    benefits = get_or_create_named_collection(Benefit, params['benefits'])
    techs = get_or_create_named_collection(Skill, params['technologies'])
    location = get_location_by_name_or_create(params['location'])
    o = EmployerOffer(employer_id=employer.id, candidate_id=candidate['id'], role=role, benefits=benefits, technologies=techs,
                      location=location, annual_salary=int(params['annual_salary']), interview_details=params.get('interview_details'),
                      job_description=params.get('job_description'))
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


def get_employers_by_techtags(tags):
    params = {'tag_%d' % i: tag.lower() for i, tag in enumerate(tags)}

    query = DBSession.execute(text("""
            select e.id as id,
                count(s.id) as noskills,
                array_agg(s.name) as matched_tags
                from employer e
            join employer_skill es
                on e.id = es.employer_id
            join skill s
                on s.id = es.skill_id
            where e.approved is not null and lower(s.name) in (%s)
            group by e.id
            order by noskills desc
            limit 20
        """ % ','.join(':%s' % k for k in params.keys())), params)

    results = list(query)
    return {r['id']: r['matched_tags'] for r in results}


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

