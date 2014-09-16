import hashlib

from scotty.models import Employer, DBSession, Office, employer_address_mapping, TrafficSource, Skill, Benefit
from scotty.services.common import get_location_by_name_or_create, get_location_by_name_or_raise, get_by_name_or_create, \
    get_or_create_named_collection
from sqlalchemy import text
from sqlalchemy.orm import joinedload


def transform_address(params):
    address = params.pop('address', None)
    if not address:
        return params, None
    for k, v in address.items():
        if k in employer_address_mapping:
            params[employer_address_mapping[k]] = v

    if 'city' in address and 'country_iso' in address:
        return params, get_location_by_name_or_create(address)
    else:
        return params, None


def employer_from_signup(params):
    email = params['email']
    contact_name = params['contact_name']
    company_name = params['company_name']
    pwd = hashlib.sha256(params.pop('pwd')).hexdigest()
    employer = Employer(
        contact_name=contact_name,
        company_name=company_name,
        email=email,
        pwd=pwd
    )
    return employer


def employer_from_login(params):
    email = params['email']
    pwd = hashlib.sha256(params['pwd']).hexdigest()
    employer = DBSession.query(Employer).filter(Employer.email == email,
                                                Employer.pwd == pwd).first()
    return employer


def add_employer_office(employer, params):
    params['address_city'] = get_location_by_name_or_raise(params['address_city'])
    office = Office(employer=employer, **params)
    DBSession.flush()
    return office


ID = lambda x: x


EMPLOYER_EDITABLES = {
    'company_name': ID,
    'website': ID,
    'address_line1': ID,
    'address_line2': ID,
    'address_line3': ID,
    'address_zipcode': ID,
    'address_city': get_location_by_name_or_raise,
    'contact_name': ID,
    'contact_phone': ID,
    'contact_email': ID,
    'contact_position': ID,
    'logo_url': ID,
    'fb_url': ID,
    'linkedin_url': ID,
    'image_video_url': ID,
    'mission_text': ID,
    'culture_text': ID,
    'vision_text': ID,
    'founding_year': ID,
    'revenue_pa': ID,
    'funding_amount': ID,
    'funding_text': ID,
    'no_of_employees': ID,
    'tech_team_size': ID,
    'tech_team_philosophy': ID,
    'recruitment_process': ID,
    'training_policy': ID,
    'traffic_source': lambda name: get_by_name_or_create(TrafficSource, name),
    'tech_tags': lambda tags: get_or_create_named_collection(Skill, tags),
    'benefits': lambda tags: get_or_create_named_collection(Benefit, tags)
}


def update_employer(obj, params, lookup=EMPLOYER_EDITABLES):
    for field, transform in lookup.items():
        if field in params:
            setattr(obj, field, transform(params[field]))


def get_employers_by_techtags(tags):
    params = {'tag_%d' % i: tag.lower() for i, tag in enumerate(tags)}

    query = DBSession.execute(
        text("""
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
            where e.id = :employer_id and c.contact_city_id is not NULL
            group by c.id
            order by noskills desc
    """), {'employer_id': str(employer_id)})

    # TODO: order results sometime
    return [r[0] for r in results]


