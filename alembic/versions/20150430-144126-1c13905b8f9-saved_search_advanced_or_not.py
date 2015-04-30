"""saved search advanced or not?

Revision ID: 1c13905b8f9
Revises: 1ed3688463e4
Create Date: 2015-04-30 14:41:26.659286

"""

# revision identifiers, used by Alembic.
revision = '1c13905b8f9'
down_revision = '1ed3688463e4'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('employer_savedsearch', sa.Column('advanced', sa.Boolean(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('employer_savedsearch', 'advanced')
    ### end Alembic commands ###
