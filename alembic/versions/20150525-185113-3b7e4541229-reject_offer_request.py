"""reject offer request

Revision ID: 3b7e4541229
Revises: 1c13905b8f9
Create Date: 2015-05-25 18:51:13.819607

"""

# revision identifiers, used by Alembic.
revision = '3b7e4541229'
down_revision = '1c13905b8f9'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('candidate_bookmark_employer', sa.Column('rejected', sa.DateTime(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('candidate_bookmark_employer', 'rejected')
    ### end Alembic commands ###