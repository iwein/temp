import hashlib
from scotty import DBSession
from scotty.models import Candidate, CandidateStatus

__author__ = 'Martin'


def candidate_from_signup(params):
    pwd = hashlib.sha256(params['pwd']).hexdigest()

    status = DBSession.query(CandidateStatus).filter(CandidateStatus.name == "ACTIVE").first()

    return Candidate(email=params['email'], password=pwd, first_name=params['first_name'], last_name=params['last_name'],
                     status=status)