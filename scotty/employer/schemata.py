from colander import MappingSchema, String, Email, SchemaNode
from scotty.configuration.models import Salutation, CompanyType
from scotty.services.schema_tools import DBChoiceValue


class SignupRequest(MappingSchema):
    company_name = SchemaNode(String())
    company_type = SchemaNode(DBChoiceValue(CompanyType))
    email = SchemaNode(String(), validator=Email())
    pwd = SchemaNode(String())
    contact_salutation = SchemaNode(DBChoiceValue(Salutation))
    contact_first_name = SchemaNode(String())
    contact_last_name = SchemaNode(String())
