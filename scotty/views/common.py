from scotty import DBSession
from sqlalchemy import func

PUT = dict(request_method="PUT", content_type='application/json', renderer="json")
POST = dict(request_method="POST", content_type='application/json', renderer="json")
DELETE = dict(request_method="DELETE", renderer="json")
GET = dict(request_method="GET", renderer="json")


def run_paginated_query(request, basequery, serializer=list):
    offset = request.params.get('offset', 0)
    limit = request.params.get('limit', 100)
    query = basequery.offset(int(offset)).limit(int(limit))
    return {"pagination": {"total": basequery.count(), "offset": offset, "count": query.count()},
            "data": serializer(query)}


def listing_request(request, DbCls, searchterm=None, ignorecase=False):
    basequery = DBSession.query(DbCls)

    if searchterm is not None:
        if ignorecase:
            filter_by = func.lower(DbCls.name).contains(func.lower(searchterm))
        else:
            filter_by = DbCls.name.contains(searchterm)
        basequery = basequery.filter(filter_by)

    return run_paginated_query(request, basequery)
