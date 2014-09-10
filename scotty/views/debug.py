from pyramid.path import AssetResolver
from pyramid.renderers import render_to_response
from pyramid.view import view_config
from scotty.views import RootController

a = AssetResolver('scotty')
resolver = a.resolve('templates/debug/pages')
templates = resolver.listdir()
TEMPLATES = {'templates': [s[:-5] for s in templates]}

class DebugController(RootController):
    @view_config(route_name='debug_home', renderer='scotty:templates/debug/index.html')
    def debug_home(self):
        return TEMPLATES

    @view_config(route_name='debug_page')
    def debug_page(self):
        template = self.request.matchdict['template']
        return render_to_response("scotty:templates/debug/pages/%s.html" % template, TEMPLATES, self.request)


def includeme(config):
    config.add_route('debug_home', '')
    config.add_route('debug_page', '/{template}')


