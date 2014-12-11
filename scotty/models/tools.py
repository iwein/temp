import codecs
from alembic import op
import os
from sqlalchemy.orm import class_mapper
from sqlalchemy.sql import table, column
import sqlalchemy as sa
from scotty.auth.provider import ADMIN_USER


DISPLAY_ALWAYS = 'DISPLAY_ALWAYS'
DISPLAY_PRIVATE = 'DISPLAY_PRIVATE'
DISPLAY_ADMIN = 'DISPLAY_ADMIN'

PUBLIC = {'display': DISPLAY_ALWAYS}
PRIVATE = {'display': DISPLAY_PRIVATE}
ADMIN = {'display': DISPLAY_ADMIN}


def allow_display(request, info, lvl):
    if not (info and info.get('display')):
        return False
    if info.get('display') == DISPLAY_ALWAYS:
        return True
    elif callable(info.get('display')):
        return info['display'](request, info, lvl)
    else:
        return info.get('display') == lvl or info.get('display', []) in lvl


def get_request_role(request, owner_id):
    display = [DISPLAY_ALWAYS]
    # hack way, but we are using UUIDs, so they shouldn't collide
    if ADMIN_USER in request.effective_principals:
        display.extend([DISPLAY_PRIVATE, DISPLAY_ADMIN])
    elif request.candidate_id == owner_id or request.employer_id == owner_id:
        display.append(DISPLAY_PRIVATE)
    return display


ID = lambda x, req: x


def json_encoder(val, request, levels=None, obfuscator=None):
    """Transforms a model into a dictionary which can be dumped to JSON."""
    if levels is None:
        levels = [DISPLAY_ALWAYS]
    columns = [c.key for c in class_mapper(val.__class__).columns if allow_display(request, c.info, levels)]
    result = {c: getattr(val, c) for c in columns if getattr(val, c, None) is not None}
    if obfuscator:
        return obfuscator(result)
    else:
        return result


class JsonSerialisable(object):
    def to_json(self, request):
        return getattr(self, '__extra__', {})


def association_proxy(val, request):
    return list(val)


def keyed_tuple_slsr(val, request):
    return val


def csv_inserter(basepath):
    def bulk_insert_names(tablename, fname, fields=None):
        if not fields:
            fields = ['name']
        base = os.path.dirname(os.path.realpath(basepath))
        file_location = os.path.normpath(os.path.join(base, '..', 'lookups', fname))
        with codecs.open(file_location, 'r', 'utf-8') as names:
            t = table(tablename, *[column(field, sa.String) for field in fields])
            op.bulk_insert(t,
                           [{field: value.strip() for field, value in zip(fields, name.split('\t'))} for name in names])

    return bulk_insert_names

