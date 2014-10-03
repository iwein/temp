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