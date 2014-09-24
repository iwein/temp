from collections import Counter
from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.configuration.models import City


def get_by_name_or_raise(cls, name):
    obj = DBSession.query(cls).filter(cls.name == name).first()
    if not obj:
        raise HTTPBadRequest("Unknown %s" % cls.__name__)
    return obj


def get_by_name_or_create(cls, name):
    obj = DBSession.query(cls).filter(cls.name == name).first()
    if not obj:
        obj = cls(name=name)
        DBSession.add(obj)
    return obj


def get_location_by_name_or_raise(location):
    city = DBSession.query(City).filter(City.name == location['city'], City.country_iso == location['country_iso']).first()
    if not city:
        raise HTTPBadRequest("Unknown Location: %s" % location)
    return city


def get_location_by_name_or_create(location):
    city = DBSession.query(City).filter(City.name == location['city'], City.country_iso == location['country_iso']).first()
    if not city:
        city = City(name=location['city'], country_iso=location['city'])
        DBSession.add(city)
    return city


def params_get_list_or_raise(params, name):
    names = params.get(name, [])
    if names and not isinstance(names, list):
        raise HTTPBadRequest("%s must be list of string." % name)
    return names


def get_or_create_named_collection(cls, names, field_name='name'):
    if not names:
        return []
    objs = DBSession.query(cls).filter(getattr(cls, field_name).in_(names)).all()
    if len(objs) < len(names):
        missings = set(names).difference(getattr(t, field_name) for t in objs)
        new_objs = [cls(**{field_name: m}) for m in missings]
        DBSession.add_all(new_objs)
        DBSession.flush()
        objs.extend(new_objs)
    return objs or []


def get_or_create_named_lookup(cls, names, field_name='name'):
    objs = get_or_create_named_collection(cls, names, field_name)
    return {o.name: o for o in objs}


def get_or_raise_named_collection(cls, names, field_name='name', require_uniqueness=True):
    if not names:
        return []
    name_set = set(names)
    if require_uniqueness:
        if len(name_set) < len(names):
            duplicates = [x for x, y in Counter(names).items() if y > 1]
            raise HTTPBadRequest("Duplicate items submitted: %s" % duplicates)

    objs = DBSession.query(cls).filter(getattr(cls, field_name).in_(name_set)).all()
    if len(objs) < len(name_set):
        missings = set(name_set).difference(getattr(t, field_name) for t in objs)
        raise HTTPBadRequest("Unknown %s: %s" %(cls.__name__, missings))
    return {o.name: o for o in objs}
