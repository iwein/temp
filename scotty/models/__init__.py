from sqlalchemy.orm import class_mapper
from scotty.models.configuration import *
from scotty.models.meta import Base


def json_encoder(val, request):
    """Transforms a model into a dictionary which can be dumped to JSON."""
    # first we get the names of all the columns on your model
    columns = [c.key for c in class_mapper(val.__class__).columns]
    # then we return their values in a dict
    result = {c: getattr(val, c) for c in columns}
    if 'id' in result:
        result.setdefault('_id', str(result['id']))
    return result