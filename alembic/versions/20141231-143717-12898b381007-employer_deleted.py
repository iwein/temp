"""employer deleted

Revision ID: 12898b381007
Revises: 42264ca2ea19
Create Date: 2014-12-31 14:37:17.864400

"""

# revision identifiers, used by Alembic.
revision = '12898b381007'
down_revision = '42264ca2ea19'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('employer', sa.Column('deleted', sa.DateTime(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('employer', 'deleted')
    ### end Alembic commands ###
