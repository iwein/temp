import codecs
from alembic import op
import os
from sqlalchemy.orm import class_mapper
from sqlalchemy.sql import table, column
import sqlalchemy as sa


DISPLAY_ALWAYS = 'DISPLAY_ALWAYS'
DISPLAY_PRIVATE = 'DISPLAY_PRIVATE'

PUBLIC = {'display': DISPLAY_ALWAYS}
PRIVATE = {'display': DISPLAY_PRIVATE}


def csv_inserter(basepath):
    def bulk_insert_names(tablename, fname, fields=None):
        if not fields:
            fields = ['name']
        base = os.path.dirname(os.path.realpath(basepath))
        file_location = os.path.normpath(os.path.join(base, '..', 'lookups', fname))
        with codecs.open(file_location, 'r', 'utf-8') as names:
            t = table(tablename, *[column(field, sa.String) for field in fields])
            op.bulk_insert(t, [{field: value.strip() for field, value in zip(fields, name.split('\t'))} for name in names])
    return bulk_insert_names


def json_encoder(val, request, level=PUBLIC):
    """Transforms a model into a dictionary which can be dumped to JSON."""
    # first we get the names of all the columns on your model
    columns = [c.key for c in class_mapper(val.__class__).columns if c.info == PUBLIC]
    # then we return their values in a dict
    result = {c: getattr(val, c) for c in columns if getattr(val, c) is not None}
    return result


class JsonSerialisable(object):
    def to_json(self, request):
        return getattr(self, '__extra__', {})


def association_proxy(val, request):
    return list(val)
