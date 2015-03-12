from pyramid.path import AssetResolver
from pyramid.renderers import render_to_response
from pyramid.view import view_config
from scotty.views import RootController


class ApiPreviewController(RootController):
    @view_config(route_name='api_preview')
    def api_preview(self):
        params = {k: v for k, v in self.request.params.items()}
        params['email'] = params.get('email', 'catch@hackandcraft.com')
        params['apikey'] = params.get('apikey')
        params['templates'] = []
        return render_to_response("scotty:views/templates/debug/api_preview.html", params, self.request)


def includeme(config):
    config.add_route('api_preview', '/preview/api')


