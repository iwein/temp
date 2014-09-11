import hashlib

from scotty.models import Employer, DBSession, Office, employer_address_mapping, TrafficSource, Skill, Benefit
from scotty.services.common import get_location_by_name_or_create, get_location_by_name_or_raise, get_by_name_or_create, \
    get_or_create_named_collection
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

    DBSession.add(employer)
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
    'image_video_url': ID,
    'mission_text': ID,
    'culture_text': ID,
    'vision_text': ID,
    'founding_date': ID,
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