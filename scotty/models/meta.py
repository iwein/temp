import uuid
from sqlalchemy import TypeDecorator, CHAR, VARCHAR, collate, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.sql.functions import FunctionElement
from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()


BIGINT_RANGE = 9223372036854775808

class NamedModel(object):
    name = None
    __name_field__ = 'name'

    def __json__(self, request):
        return self.name

    def __repr__(self):
        return self.name



class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses Postgresql's UUID type, otherwise uses
    CHAR(32), storing as stringified hex values.

    """
    impl = CHAR

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value)
            else:
                # hexstring
                return "%.32x" % value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            return uuid.UUID(value)


class CaseInsensitive(FunctionElement):
    __visit_name__ = 'notacolumn'
    name = 'CaseInsensitive'
    type = VARCHAR()


@compiles(CaseInsensitive, 'sqlite')
def case_insensitive_sqlite(element, compiler, **kw):
    arg1, = list(element.clauses)
    return compiler.process(collate(arg1, 'nocase'), **kw)


@compiles(CaseInsensitive, 'postgresql')
def case_insensitive_postgresql(element, compiler, **kw):
    arg1, = list(element.clauses)
    return compiler.process(func.lower(arg1), **kw)