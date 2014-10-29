from scotty.models.meta import Base
from sqlalchemy import Column, String

__author__ = 'Harry'


class CmsContent(Base):
    __tablename__ = 'cms_content'
    key = Column(String(512), nullable=False, primary_key=True)
    value = Column(String(4000), nullable=False)


    def __json__(self, request):
        return {"key": self.key, "value": self.value}
