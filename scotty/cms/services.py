from pyramid.httpexceptions import HTTPBadRequest
from scotty.models.meta import DBSession
from scotty.cms.models import CmsContent

__author__ = 'Harry'


def set_content(params):
    if not isinstance(params, list):
        raise HTTPBadRequest("Must submit list of keys as root level.")
    for p in params:
        print p['key']
        DBSession.query(CmsContent).filter(CmsContent.key == p['key']).delete()
        content = CmsContent(key=p['key'], value=p['value'])
        DBSession.add(content)
        DBSession.flush()
    return DBSession.query(CmsContent).all()


def get_content(params):
    keys = filter(None, params.get('keys', '').split(','))
    content = DBSession.query(CmsContent).filter(CmsContent.key.in_(keys)).all()
    return content