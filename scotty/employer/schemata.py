from colander import MappingSchema, String, Email, SchemaNode, Boolean, url, SequenceSchema
import colander
from scotty.configuration.models import Salutation, CompanyType
from scotty.services.schema_tools import DBChoiceValue, must_be_true


class SignupRequest(MappingSchema):
    company_name = SchemaNode(String())
    company_type = SchemaNode(DBChoiceValue(CompanyType))
    email = SchemaNode(String(), validator=Email())
    pwd = SchemaNode(String())
    contact_salutation = SchemaNode(DBChoiceValue(Salutation))
    contact_first_name = SchemaNode(String())
    contact_last_name = SchemaNode(String())


class AgreeTosRequest(MappingSchema):
    agreedTos = SchemaNode(Boolean(), validator=must_be_true)


class PictureRequest(MappingSchema):
    url = SchemaNode(String(), validator=colander.url)
    description = SchemaNode(String(), if_missing='')


class SetPicturesRequest(SequenceSchema):
    pics = PictureRequest()

