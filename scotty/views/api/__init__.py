from scotty.views.api import configuration

def includeme(config):
    config.include(configuration, route_prefix='/config')