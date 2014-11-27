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
