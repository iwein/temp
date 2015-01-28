from collections import Counter
from colander import Invalid, SchemaNode, MappingSchema, Int, Range, String, Length, Email
from scotty import DBSession
from scotty.candidate.models import get_locations_from_structure, InviteCode
from scotty.configuration.models import Role, Skill
from scotty.models.common import get_or_create_named_collection
from sqlalchemy import null


class DBChoiceValue(object):
    def __init__(self, sqla_cls):
        self.sqla_cls = sqla_cls
        self.name_field = sqla_cls.__name_field__
        super(DBChoiceValue, self).__init__()

    def serialize(self, node, appstruct):
        if appstruct is null:
            return null
        if not isinstance(appstruct, self.sqla_cls):
            raise Invalid(node, 'TYPE ERROR', value=self.sqla_cls.__name)
        return getattr(appstruct, self.name_field)

    def deserialize(self, node, cstruct):
        if cstruct is null and not node.required:
            return null
        if not isinstance(cstruct, basestring):
            raise Invalid(node, 'TYPE ERROR', value='string')
        namefield = getattr(self.sqla_cls, self.name_field)
        obj = DBSession.query(self.sqla_cls).filter(namefield == cstruct).first()
        if not obj:
            raise Invalid(node, 'INVALID CHOICE')
        return obj

    def cstruct_children(self, node, cstruct):
        return []


class DBListValues(object):
    def __init__(self, sqla_cls, must_exist=False, require_unique=True, min_length=None):
        self.min_length = min_length
        self.require_unique = require_unique
        self.must_exist = must_exist
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
            raise Invalid("DUPLICATE ITEMS", value=[x for x, y in Counter(cstruct).items() if y > 1])
        elif self.must_exist:
            objs = DBSession.query(self.sqla_cls).filter(getattr(self.sqla_cls, self.name_field).in_(name_set)).all()
            if len(objs) < len(name_set):
                missings = set(name_set).difference(getattr(t, self.name_field) for t in objs)
                raise Invalid("UNKNOWN VALUES", value=missings)
            return {o.name: o for o in objs}

        else:
            return get_or_create_named_collection(self.sqla_cls, cstruct, self.name_field)

    def cstruct_children(self, node, cstruct):
        return []


class TargetPosition(MappingSchema):
    role = SchemaNode(DBChoiceValue(Role))
    minimum_salary = SchemaNode(Int(), validator=Range(min=0, max=99000000))
    skills = SchemaNode(DBListValues(Skill, min_length=1))


class PreferredLocationType(object):
    def serialize(self, node, appstruct):
        if appstruct is null:
            return null
        return appstruct

    def deserialize(self, node, cstruct):
        if cstruct is null:
            return null
        if not isinstance(cstruct, dict):
            raise Invalid(node, 'NOT A MAPPING', value='mapping')
        locations = get_locations_from_structure(cstruct)
        return locations

    def cstruct_children(self, node, cstruct):
        return []





class PreSignupRequest(MappingSchema):
    target_position = TargetPosition()
    preferred_locations = SchemaNode(PreferredLocationType())


class SignupRequest(MappingSchema):
    email = SchemaNode(String(), validator=Email())
    pwd = SchemaNode(String(), validator=Length(8))
    first_name = SchemaNode(String(), validator=Length(2))
    last_name = SchemaNode(String(), validator=Length(2))
    invite_code = SchemaNode(DBChoiceValue(InviteCode), missing = None)