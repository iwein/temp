from operator import methodcaller
from scotty.models.meta import DBSession
from sqlalchemy import func

PUT = dict(request_method="PUT", content_type='application/json', renderer="json")
POST = dict(request_method="POST", content_type='application/json', renderer="json")
DELETE = dict(request_method="DELETE", renderer="json")
GET = dict(request_method="GET", renderer="json")


def run_paginated_query(request, basequery, serializer=list,  counter=methodcaller('count'), default_limit=500):
    offset = request.params.get('offset', 0)
    limit = request.params.get('limit', default_limit)
    query = basequery.offset(int(offset)).limit(int(limit))
    results = serializer(query)
    return {"pagination": {"total": counter(basequery), "offset": offset, "count": len(results)},
            "data": results}


def listing_request(request, DbCls, searchterm=None, ignorecase=False, order_field=None, qmodifier=None):
    basequery = DBSession.query(DbCls)
    name_field = getattr(DbCls, DbCls.__name_field__)

    if searchterm is not None:
        if ignorecase:
            filter_by = func.lower(name_field).contains(func.lower(searchterm))
        else:
            filter_by = name_field.contains(searchterm)
        basequery = basequery.filter(filter_by)
    if qmodifier is not None:
        basequery = qmodifier(basequery)

    return run_paginated_query(request, basequery.order_by(order_field if order_field is not None else name_field))


def list_featured(request, cls):
    query = DBSession.query(cls).filter(cls.featured_order != None).order_by(cls.featured_order.asc())
    return run_paginated_query(request, query)