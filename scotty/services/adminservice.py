from datetime import datetime
from uuid import uuid4
from scotty.models.employer import Employer
from scotty.models.meta import DBSession

schema = {"type": "object", "properties": {"email": {"type": "string", "format": "email", "required": True},
                                           "contact_name": {"type": "string", "required": True},
                                           "company_name": {"type": "string", "required": True}, }}


def invite_employer(params):
    employer = Employer(
        company_name=params['company_name'],
        contact_name=params['contact_name'],
        email=params['email'],
        invite_token=uuid4(),
        invite_sent=datetime.now())
    DBSession.add(employer)
    DBSession.flush()
    return employer
