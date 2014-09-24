
def includeme(config):
    config.add_route('admin_employer', 'employers')
    config.add_route('admin_employer_by_status', 'employers/{status}')
    config.add_route('admin_employer_approve', 'employers/{employer_id}/approve')
    config.scan()