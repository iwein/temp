from pyramid.httpexceptions import HTTPBadRequest
from simplejson import JSONDecodeError

class InvalidContentTypeException(object):
    pass


class ContentTypePredicate(object):
    """
    Pyramid predicate for matching against ``Content-Type`` request header.
    Should live in ``pyramid.config.predicates``.

    .. seealso::

        http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/hooks.html#view-and-route-predicates
    """
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'content_type = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        if request.content_type != self.val:
            raise HTTPBadRequest("Invalid Content-Type Header. Must be %s" % self.val)
        elif self.val == 'application/json':
            try:
                return request.json is not None
            except JSONDecodeError:
                raise HTTPBadRequest("Invalid JSON Body Content.")
        return True
