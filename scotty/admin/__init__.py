
def includeme(config):
    config.add_route('admin_employer', 'employers')
    config.add_route('admin_search_employer', 'search/employers')
    config.add_route('admin_search_candidates', 'search/candidates')
    config.add_route('admin_employer_by_status', 'employers/{status}')
    config.add_route('admin_employer_approve', 'employers/{employer_id}/approve')

    config.add_route('admin_offers', 'offers')
    config.add_route('admin_offer', 'offers/{id}')
    config.add_route('admin_offer_accept', 'offers/{id}/accept')
    config.add_route('admin_offer_reject', 'offers/{id}/reject')
    config.add_route('admin_offer_status', 'offers/{id}/status')
    config.add_route('admin_offer_signed', 'offers/{id}/signed')
    config.add_route('admin_offer_withdraw', 'offers/{id}/withdraw')
    config.scan()