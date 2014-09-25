from datetime import datetime
from uuid import uuid4
from scotty.configuration.models import Salutation, CompanyType

from scotty.employer.models import FullEmployer
from scotty.models.common import get_by_name_or_raise
from scotty.models.meta import DBSession


def invite_employer(params):
    employer = FullEmployer(
        company_name=params['company_name'],
        company_type=get_by_name_or_raise(CompanyType, params['company_type']),
        contact_first_name=params['contact_first_name'],
        contact_last_name=params['contact_last_name'],
        contact_salutation=get_by_name_or_raise(Salutation, params['contact_salutation']),
        email=params['email'],
        invite_token=uuid4(),
        invite_sent=datetime.now())
    DBSession.add(employer)
    DBSession.flush()
    return employer
