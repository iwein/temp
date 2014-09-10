import hashlib

from scotty.models import Employer, DBSession, Office, employer_address_mapping
from scotty.services.common import get_location_by_name_or_create
from sqlalchemy.orm import joinedload


def transform_address(params):
    address = params.pop('address', None)
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
    params, city = transform_address(params)
    params['address_city'] = city
    office = Office(employer=employer, **params)
    DBSession.flush()
    return office
