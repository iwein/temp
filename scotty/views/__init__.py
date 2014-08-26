from functools import wraps
from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config


def pass_request(f):
    @wraps(f)
    def __inner__(self):
        return f(self, self.request)
    return __inner__


class RootController(object):
    def __init__(self, request):
        self.request = request


@view_config(route_name='home', renderer='scotty:templates/index.pt')
def home(request):
    return {}


def notfound(request):
    return HTTPNotFound('Really.')


def includeme(config):
    config.add_route('home', '/')

    config.include("scotty.views.debug", route_prefix='/debug')
    config.include("scotty.views.api", route_prefix='/api/v1')


    config.add_notfound_view(notfound, append_slash=True)
    config.scan()
