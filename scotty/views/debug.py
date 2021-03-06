from pyramid.path import AssetResolver
from pyramid.renderers import render_to_response
from pyramid.view import view_config
from scotty.views import RootController

a = AssetResolver('scotty')
resolver = a.resolve('views/templates/debug/pages')
templates = resolver.listdir()
TEMPLATES = {'templates': [s[:-5] for s in templates]}

class DebugController(RootController):
    @view_config(route_name='debug_home', renderer='scotty:views/templates/debug/index.html')
    def debug_home(self):
        params = {k: v for k, v in self.request.params.items()}
        params['email'] = params.get('email', 'catch@hackandcraft.com')
        params['apikey'] = params.get('apikey')
        params.update(TEMPLATES)
        return params

    @view_config(route_name='debug_page')
    def debug_page(self):
        template = self.request.matchdict['template']
        params = {k: v for k, v in self.request.params.items()}
        params['email'] = params.get('email', 'catch@hackandcraft.com')
        params['apikey'] = params.get('apikey')
        params.update(TEMPLATES)
        return render_to_response("scotty:views/templates/debug/pages/%s.html" % template, params, self.request)

def includeme(config):
    config.add_route('debug_home', '')
    config.add_static_view('static', 'scotty:views/templates/debug/static', cache_max_age=3600)
    config.add_route('debug_page', '/{template}')


