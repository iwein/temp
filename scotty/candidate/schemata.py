from datetime import date

from colander import Invalid, SchemaNode, MappingSchema, Int, Range, String, Length, Email, Date, SequenceSchema, \
    Integer, Boolean, null
from scotty.candidate.models import InviteCode, get_locations_from_structure
from scotty.configuration.models import Role, Skill, Company, Country, Institution, Degree, Course, SkillLevel, Locale
from scotty.models.meta import BIGINT_RANGE
from scotty.services.schema_tools import DBChoiceValue, DBListValues, must_be_true, \
    db_choice_validator, current_year_range


class PreferredLocationType(object):
    def __init__(self, min_length=None):
        super(PreferredLocationType, self).__init__()
        self.min_length = min_length

    def serialize(self, node, appstruct):
        if appstruct is null:
            return null
        return appstruct

    def deserialize(self, node, cstruct):
        if cstruct is null:
            return null
        if not isinstance(cstruct, dict):
            raise Invalid(node, 'NOT A MAPPING', value='mapping')
        if self.min_length and len(cstruct) < self.min_length:
            raise Invalid(node, 'NOT ENOUGH ITEMS', value=self.min_length)

        locations = get_locations_from_structure(cstruct)
        return locations

    def cstruct_children(self, node, cstruct):
        return []


class PreferredLocationRequest(MappingSchema):
    locations = SchemaNode(PreferredLocationType(min_length=1))


class TargetPosition(MappingSchema):
    role = SchemaNode(DBChoiceValue(Role))
    minimum_salary = SchemaNode(Int(), validator=Range(min=0, max=BIGINT_RANGE))
    skills = SchemaNode(DBListValues(Skill, create_unknown=True, min_length=1))


class PreSignupRequest(MappingSchema):
    target_position = TargetPosition()
    preferred_locations = SchemaNode(PreferredLocationType(min_length=1))


class SignupRequest(MappingSchema):
    email = SchemaNode(String(), validator=Email())
    pwd = SchemaNode(String(), validator=Length(min=8))
    first_name = SchemaNode(String(), validator=Length(min=2))
    last_name = SchemaNode(String(), validator=Length(min=2))
    invite_code = SchemaNode(DBChoiceValue(InviteCode), missing=None)
    agreedTos = SchemaNode(Boolean(), validator=must_be_true)
    locale = SchemaNode(DBChoiceValue(Locale, default_key='de'))


class WorkExperienceRequest(MappingSchema):
    company = SchemaNode(DBChoiceValue(Company, create_unknown=True))
    start = SchemaNode(Date(), validator=Range(date(1900, 1, 1)))
    end = SchemaNode(Date(), validator=Range(date(1900, 1, 1)), missing=None)
    summary = SchemaNode(String(), validator=Length(min=2), missing=None)
    role = SchemaNode(DBChoiceValue(Role, create_unknown=True), missing=None)
    country_iso = SchemaNode(String(), missing=None, validator=db_choice_validator(Country, keyfield='iso'))
    city = SchemaNode(String(), validator=Length(max=500), missing=None)
    skills = SchemaNode(DBListValues(Skill, create_unknown=True), missing=[])

    def validator(self, schema, value):
        if value.get('end') and value['end'] < value['start']:
            raise Invalid(schema['end'], 'END MUST BE AFTER START')


class ListWorkExperienceRequest(SequenceSchema):
    exp = WorkExperienceRequest()


class EducationRequest(MappingSchema):
    start = SchemaNode(Integer(), validator=current_year_range)
    end = SchemaNode(Integer(), validator=current_year_range, missing=None)
    course = SchemaNode(DBChoiceValue(Course, create_unknown=True), missing=None)
    institution = SchemaNode(DBChoiceValue(Institution, create_unknown=True))
    degree = SchemaNode(DBChoiceValue(Degree, create_unknown=True), missing=None)

    def validator(self, schema, value):
        if value.get('end') and value['end'] < value['start']:
            raise Invalid(schema['end'], 'END MUST BE AFTER START')


class ListEducationRequest(SequenceSchema):
    edu = EducationRequest()


class LevelledSkillRequest(MappingSchema):
    level = SchemaNode(DBChoiceValue(SkillLevel), missing=None)
    skill = SchemaNode(DBChoiceValue(SkillLevel), missing=None)


class SkillsRequest(SequenceSchema):
    skills = SchemaNode(DBListValues(Skill, min_length=3))