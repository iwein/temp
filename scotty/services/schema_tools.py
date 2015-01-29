from collections import Counter
from datetime import datetime

from colander import Invalid, null, Range, deferred
from scotty.models.common import get_or_create_named_collection
from scotty.models.meta import DBSession


def db_choice_validator(cls, keyfield=None):
    name_field = getattr(cls, keyfield or cls.__name_field__)

    def validator(node, value):
        obj = DBSession.query(cls).filter(name_field == value).first()
        if not obj:
            raise Invalid(node, 'INVALID CHOICE')

    return validator


@deferred
def current_year_range(node, kw):
    return Range(min=1900, max=datetime.today().year)


def must_be_true(node, value):
    if not value:
        raise Invalid(node, 'MUST BE TRUE')


class DBChoiceValue(object):
    def __init__(self, sqla_cls, create_unknown=False, keyfield=None):
        self.create_unknown = create_unknown
        self.sqla_cls = sqla_cls
        self.name_field = keyfield or sqla_cls.__name_field__
        super(DBChoiceValue, self).__init__()

    def serialize(self, node, appstruct):
        if appstruct is null:
            return null
        if not isinstance(appstruct, self.sqla_cls):
            raise Invalid(node, 'TYPE ERROR', value=self.sqla_cls.__name)
        return getattr(appstruct, self.name_field)

    def deserialize(self, node, cstruct):
        if cstruct is null or cstruct == '' or cstruct is None:
            return null
        if not isinstance(cstruct, basestring):
            raise Invalid(node, 'TYPE ERROR', value='string')
        namefield = getattr(self.sqla_cls, self.name_field)
        obj = DBSession.query(self.sqla_cls).filter(namefield == cstruct).first()
        if not obj:
            if self.create_unknown:
                obj = self.sqla_cls(**{self.sqla_cls.__name_field__: cstruct})
                DBSession.add(obj)
            else:
                raise Invalid(node, 'INVALID CHOICE')
        return obj

    def cstruct_children(self, node, cstruct):
        return []


class DBListValues(object):
    def __init__(self, sqla_cls, create_unknown=False, require_unique=True, min_length=None):
        self.min_length = min_length
        self.require_unique = require_unique
        self.create_unknown = create_unknown
        self.sqla_cls = sqla_cls
        self.name_field = sqla_cls.__name_field__
        super(DBListValues, self).__init__()

    def serialize(self, node, appstruct):
        if appstruct is null:
            return null
        if not all(isinstance(elem, self.sqla_cls) for elem in appstruct):
            raise Invalid(node, 'INVALID VALUES', value=[elem for elem in appstruct if not isinstance(elem,
                                                                                                      self.sqla_cls)])
        return [getattr(a, self.name_field) for a in appstruct]

    def deserialize(self, node, cstruct):
        if cstruct is null:
            return null
        if not isinstance(cstruct, list):
            raise Invalid(node, 'NOT A LIST')
        elif self.min_length > len(cstruct):
            raise Invalid(node, 'NOT ENOUGH ITEMS', value=self.min_length)
        elif not all(isinstance(s, basestring) for s in cstruct):
            raise Invalid(node, 'LIST CONTAINS NON STRINGS',
                          value=[s for s in cstruct if not isinstance(s, basestring)])
        name_set = set(cstruct)
        if self.require_unique and len(name_set) < len(cstruct):
            raise Invalid(node, "DUPLICATE ITEMS", value=[x for x, y in Counter(cstruct).items() if y > 1])
        elif self.create_unknown:
            return get_or_create_named_collection(self.sqla_cls, cstruct, self.name_field)
        else:
            objs = DBSession.query(self.sqla_cls).filter(getattr(self.sqla_cls, self.name_field).in_(name_set)).all()
            if len(objs) < len(name_set):
                missings = set(name_set).difference(getattr(t, self.name_field) for t in objs)
                raise Invalid(node, "UNKNOWN VALUES", value=missings)
            return objs

    def cstruct_children(self, node, cstruct):
        return []
