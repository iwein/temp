from datetime import datetime

from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.configuration.models import RejectionReason
from scotty.employer.models import Employer
from scotty.models.common import get_by_name_or_create, get_by_name_or_raise
from scotty.offer.models import Offer


def set_offer_signed(offer, candidate, employer, params, emailer):
    try:
        start_date = params['start_date']
        start_salary = params['start_salary']
    except KeyError:
        raise HTTPBadRequest("Missing start_date or start_salary")
    offer.set_contract_signed(start_date, start_salary)

    # REJECT OTHER OFFERS
    reason = get_by_name_or_raise(RejectionReason, RejectionReason.OTHER)
    offers = DBSession.query(Offer).filter(Offer.candidate_id == offer.candidate_id,
                                           Offer.id != offer.id,
                                           Offer.by_active()).all()
    for offer in offers:
        offer.set_rejected(reason, 'Accepted another offer.')
    # EMAIL ADMIN
    emailer.send_admin_candidate_hired_email(
        candidate_name=candidate.full_name,
        contact_name=employer.contact_name,
        company_name=employer.company_name,
        offer_id=offer.id)

    # EMAIL CANDIDATE
    emailer.send_candidate_hired_email(offer, candidate, employer)

    # EMAIL REJECTED EMPLOYERS
    rejects = DBSession.query(Employer).join(Offer).filter(Offer.candidate_id == offer.candidate_id,
                                                           Employer.id != offer.employer_id,
                                                           Offer.by_active()).all()
    rejection_reason = "I accepted another, better offer."
    emailer.send_employers_offer_rejected(offer, candidate, rejects, rejection_reason)

    return offer


def get_offer_newsfeed(offer, **extra):
    events = []
    now = datetime.utcnow()

    def recency(t):
        if not t:
            return None
        return (now - t).total_seconds()

    def wrap_event(name, field):
        d = getattr(offer, field)
        e = {'name': name, 'recency': recency(d), 'date': d}
        e.update(extra)
        return e

    events.append(wrap_event('OFFER_MADE', 'created'))
    events.append(wrap_event('ACCEPTED', 'accepted'))
    events.append(wrap_event('REJECTED', 'rejected'))
    events.append(wrap_event('INTERVIEWING', 'interview'))
    events.append(wrap_event('NEGOCIATING', 'contract_negotiation'))
    events.append(wrap_event('CONTRACT_SIGNED', 'contract_signed'))

    events_with_recency = filter(lambda x: x.get('recency'), events)
    return sorted(events_with_recency, key=lambda k: k['recency'])
