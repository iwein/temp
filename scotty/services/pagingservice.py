__author__ = 'marti_000'

from sqlalchemy import text
from scotty.models.meta import DBSession


def get_paging_params(request, default_offset=0, default_limit=20):
    offset = int(request.params.get('offset', default_offset))
    limit = int(request.params.get('limit', default_limit))
    return {'offset': offset, 'limit': limit}


class Pager(object):
    def __init__(self, sql, params):
        results = list(DBSession.execute(text(sql), params))
        if len(results):
            total = results[0]["total"]
        else:
            total = 0
        self.ids = [row["id"] for row in results]
        self.extra = {row['id']: {k: v for k, v in row.items() if k not in ['id', 'total']} for row in results}
        self.total = total
        self.offset = params.get('offset', 0)


class ObjectBuilder(object):
    def __init__(self, cls, field_name='id'):
        self.cls = cls

    def serialize(self, pager, adjust_query=None):
        query = DBSession.query(self.cls).filter(self.cls.id.in_(pager.ids))
        if adjust_query:
            query = adjust_query(query)
        results = query.all()
        result_lookup = {str(r.id): r for r in results}
        ordered_results = []
        for id in pager.ids:
            obj = result_lookup.get(id)
            if obj:
                obj.__extra__ = pager.extra.get(id)
                ordered_results.append(obj)
        return {"pagination": {"total": pager.total, "offset": pager.offset, "count": len(ordered_results)},
                "data": ordered_results}
