from collections import Counter
from pyramid.httpexceptions import HTTPBadRequest
from scotty import DBSession
from scotty.candidate.models import PreferredLocation
from scotty.configuration.models import City
from sqlalchemy import or_, and_


def get_by_name_or_raise(cls, name):
    if not name:
        return None
    namefield = getattr(cls, cls.__name_field__)
    obj = DBSession.query(cls).filter(namefield == name).first()
    if not obj:
        raise HTTPBadRequest("Unknown %s" % cls.__name__)
    return obj


def get_by_name_or_create(cls, name):
    if not name:
        return None
    namefield = getattr(cls, cls.__name_field__)
    obj = DBSession.query(cls).filter(namefield == name).first()
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
    city = DBSession.query(City).filter(City.name == location['city'], City.country_iso == location['country_iso'
                                                                                                    '']).first()
    if not city:
        city = City(name=location['city'], country_iso=location['city'])
        DBSession.add(city)
    return city


def get_locations_from_structure(locations):
    if not locations:
        return []
    def identify(arg):
        c, l = arg
        return len(c) == 2 and (not l or (len(l) > 0 and not isinstance(l, basestring) and (isinstance(l, list))))

    srclist = filter(identify, locations.items())

    filters = []
    for country_iso, city_list in srclist:
        if city_list:
            filters.append(and_(City.country_iso == country_iso, City.name.in_(city_list)))

    lookup = {}
    if filters:
        cities = DBSession.query(City).filter(or_(*filters)).all()
        for city in cities:
            lookup.setdefault(city.country_iso, {})[city.name] = city

    locations = []
    for country_iso, city_list in srclist:
        if city_list:
            l = lookup[country_iso]
            for city_name in city_list:
                locations.append(PreferredLocation(city_id=l[city_name].id))
        else:
            locations.append(PreferredLocation(country_iso=country_iso))

    return locations


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
        return {}
    name_set = set(names)
    if require_uniqueness:
        if len(name_set) < len(names):
            duplicates = [x for x, y in Counter(names).items() if y > 1]
            raise HTTPBadRequest("Duplicate items submitted: %s" % duplicates)

    objs = DBSession.query(cls).filter(getattr(cls, field_name).in_(name_set)).all()
    if len(objs) < len(name_set):
        missings = set(name_set).difference(getattr(t, field_name) for t in objs)
        raise HTTPBadRequest("Unknown %s: %s" % (cls.__name__, missings))
    return {o.name: o for o in objs}
