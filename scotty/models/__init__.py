from sqlalchemy.orm import class_mapper
from sqlalchemy import (
    Column,
    Index,
    Integer,
    Text,
    )

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    )

from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()


class MyModel(Base):
    __tablename__ = 'models'
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    value = Column(Integer)
    counter = Column(Integer, default = 0)

Index('my_index', MyModel.name, unique=True, mysql_length=255)


def json_encoder(val, request):
    """Transforms a model into a dictionary which can be dumped to JSON."""
    # first we get the names of all the columns on your model
    columns = [c.key for c in class_mapper(val.__class__).columns]
    # then we return their values in a dict
    result = {c: getattr(val, c) for c in columns}
    if 'id' in result:
        result.setdefault('_id', str(result['id']))
    return result