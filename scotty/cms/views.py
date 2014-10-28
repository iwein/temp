from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from scotty.cms.services import set_content, get_content
from scotty.views import RootController
from scotty.views.common import GET, PUT

__author__ = 'Harry'

def includeme(config):
    config.add_route('cms_set_content', 'set')
    config.add_route('cms_get_content', 'get')
    config.scan()


class CmsController(RootController):
    @view_config(route_name='cms_set_content', permission=NO_PERMISSION_REQUIRED, **PUT)
    def set(self):
        return set_content(self.request.json)


    @view_config(route_name='cms_get_content', permission=NO_PERMISSION_REQUIRED, **GET)
    def get(self):
        return get_content(self.request.params)