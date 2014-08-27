from scotty.views.api import configuration, candidate


def includeme(config):
    config.include(configuration, route_prefix='/config')
    config.include(candidate, route_prefix='/candidates')