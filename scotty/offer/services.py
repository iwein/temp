from datetime import datetime

from pyramid.httpexceptions import HTTPBadRequest


def set_offer_signed(offer, params, emailer):
    try:
        start_date = params['start_date']
        start_salary = params['start_salary']
    except KeyError:
        raise HTTPBadRequest("Missing start_date or start_salary")
    offer.set_contract_signed(start_date, start_salary)

    emailer.send_admin_candidate_hired_email(
        candidate_name=offer.candidate.full_name,
        contact_name=offer.employer.contact_name,
        company_name=offer.employer.company_name,
        offer_id=offer.id)
    return offer


def get_offer_timeline(offer):
    events = []
    now = datetime.utcnow()

    def recency(t):
        if not t:
            return None
        return (now - t).total_seconds()

    events.append({'name': 'OFFER_MADE', 'recency': recency(offer.created), 'date':offer.created})
    events.append({'name': 'ACCEPTED', 'recency': recency(offer.accepted), 'date':offer.accepted})
    events.append({'name': 'REJECTED', 'recency': recency(offer.rejected), 'date':offer.rejected})
    events.append({'name': 'INTERVIEWING', 'recency': recency(offer.interview), 'date':offer.interview})
    events.append({'name': 'NEGOCIATING', 'recency': recency(offer.contract_negotiation), 'date':offer.contract_negotiation})
    events.append({'name': 'CONTRACT_SIGNED', 'recency': recency(offer.contract_signed), 'date':offer.contract_signed})

    events_with_recency = filter(lambda x: x.get('recency'), events)
    return sorted(events_with_recency, key=lambda k: k['recency'])
