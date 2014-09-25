
def includeme(config):
    config.add_route('employers_invite', 'invite/{token}')
    config.add_route('employer_login', 'login')
    config.add_route('employer_logout', 'logout')

    config.add_route('employers', '')
    config.add_route('employer', '{employer_id}')
    config.add_route('employer_interestedcandidates', '{employer_id}/interestedcandidates')
    config.add_route('employer_suggested_candidates', '{employer_id}/suggestedcandidates')
    config.add_route('employer_signup_stage', '{employer_id}/signup_stage')
    config.add_route('employer_apply', '{employer_id}/apply')
    config.add_route('employer_offices', '{employer_id}/offices')
    config.add_route('employer_office', '{employer_id}/offices/{office_id}')

    config.add_route('employer_offers', '{employer_id}/offers')
    config.add_route('employer_offer', '{employer_id}/offers/{offer_id}')
    config.scan()