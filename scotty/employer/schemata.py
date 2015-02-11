from colander import MappingSchema, String, Email, SchemaNode, Boolean, url, SequenceSchema
import colander
from scotty.configuration.models import Salutation, CompanyType, Locale
from scotty.services.schema_tools import DBChoiceValue, must_be_true, db_choice_validator


class SignupRequest(MappingSchema):
    company_name = SchemaNode(String())
    company_type = SchemaNode(DBChoiceValue(CompanyType))
    email = SchemaNode(String(), validator=Email())
    pwd = SchemaNode(String())
    contact_salutation = SchemaNode(DBChoiceValue(Salutation))
    contact_first_name = SchemaNode(String())
    contact_last_name = SchemaNode(String())
    locale = SchemaNode(DBChoiceValue(Locale, default_key='de'))


class AgreeTosRequest(MappingSchema):
    agreedTos = SchemaNode(Boolean(), validator=must_be_true)


class PictureRequest(MappingSchema):
    url = SchemaNode(String(), validator=colander.url)
    description = SchemaNode(String(), if_missing='')


class SetPicturesRequest(SequenceSchema):
    pics = PictureRequest()

