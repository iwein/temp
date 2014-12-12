from datetime import datetime
from scotty.models import PRIVATE
from scotty.models.meta import Base, GUID, DBSession
from sqlalchemy import Column, String, DateTime


class UnifiedLogin(Base):
    __tablename__ = 'unified_login'
    email = Column(String(512), primary_key=True)
    pwd = Column(String(255), nullable=False)
    pwdforgot_token = Column(GUID, unique=True, info=PRIVATE)
    pwdforgot_sent = Column(DateTime, info=PRIVATE)
    table_name = Column(String(20), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.now)
