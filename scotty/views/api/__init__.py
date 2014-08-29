from scotty.views.api import configuration, candidate, employer


def includeme(config):
    config.include(configuration, route_prefix='/config')
    config.include(candidate, route_prefix='/candidates')
    config.include(employer, route_prefix='/employers')