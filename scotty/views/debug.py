from pyramid.view import view_config
import pyramid_mako
from scotty.views import RootController


class DebugController(RootController):
    @view_config(route_name='debug_home', renderer='scotty:templates/debug/index.html')
    def debug_home(self):
        return {}

    @view_config(route_name='debug_config', renderer='scotty:templates/debug/config.html')
    def debug_config(self):
        return {}

    @view_config(route_name='debug_employer', renderer='scotty:templates/debug/employer.pt')
    def debug_employer(self):
        return {}

    @view_config(route_name='debug_candidate', renderer='scotty:templates/debug/candidate.html')
    def debug_candidate(self):
        return {}


def includeme(config):
    config.add_directive('add_mako_renderer', pyramid_mako.add_mako_renderer)
    config.add_mako_renderer(".html")


    config.add_route('debug_home', '')
    config.add_route('debug_config', '/config')
    config.add_route('debug_candidate', '/candidate')
    config.add_route('debug_employer', '/employer')


