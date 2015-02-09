from datetime import datetime
from scotty.models.meta import Base
from sqlalchemy import Column, String, DateTime, Integer, UniqueConstraint


class Referral(Base):
    __tablename__ = 'referral'
    sndr_email = Column(String(512), nullable=False, primary_key=True)
    sndr_name = Column(String(512), nullable=False)
    rcvr_email = Column(String(512), nullable=False, primary_key=True)
    rcvr_name = Column(String(512), nullable=False)

    last_sent = Column(DateTime, nullable=False, default=datetime.now)
    sent_count = Column(Integer, nullable=False, default=1)
