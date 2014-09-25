

def includeme(config):
    config.add_route('candidates', '')
    config.add_route('candidate_login', 'login')
    config.add_route('candidate_logout', 'logout')
    config.add_route('candidate_requestpassword', 'requestpassword')
    config.add_route('candidate_resetpassword', 'resetpassword/{token}')
    config.add_route('candidate_activate', 'activate/{token}')

    config.add_route('candidate_signup_stage', '{candidate_id}/signup_stage')
    config.add_route('candidate', '{candidate_id}')
    config.add_route('candidate_picture', '{candidate_id}/picture')
    config.add_route('candidate_skills', '{candidate_id}/skills')
    config.add_route('candidate_preferred_locations', '{candidate_id}/preferred_locations')
    config.add_route('candidate_languages', '{candidate_id}/languages')

    config.add_route('candidate_educations', '{candidate_id}/education')
    config.add_route('candidate_education', '{candidate_id}/education/{id}')

    config.add_route('candidate_bookmarks', '{candidate_id}/bookmarks')
    config.add_route('candidate_bookmark', '{candidate_id}/bookmarks/{id}')

    config.add_route('candidate_work_experiences', '{candidate_id}/work_experience')
    config.add_route('candidate_work_experience', '{candidate_id}/work_experience/{id}')

    config.add_route('target_positions', '{candidate_id}/target_positions')
    config.add_route('target_position', '{candidate_id}/target_positions/{id}')

    config.add_route('candidate_offers', '{candidate_id}/offers')
    config.add_route('candidate_offer', '{candidate_id}/offers/{id}')
    config.add_route('candidate_offer_accept', '{candidate_id}/offers/{id}/accept')
    config.add_route('candidate_offer_reject', '{candidate_id}/offers/{id}/reject')
    config.scan()