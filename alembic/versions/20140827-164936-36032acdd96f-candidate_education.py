"""candidate education

Revision ID: 36032acdd96f
Revises: 1413d97c9b30
Create Date: 2014-08-27 16:49:36.638000

"""

# revision identifiers, used by Alembic.
from scotty.models import GUID
from scotty.models.tools import csv_inserter

revision = '36032acdd96f'
down_revision = '1413d97c9b30'

from alembic import op
import sqlalchemy as sa


bulk_insert_names = csv_inserter(__file__)

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('institution',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('candidate_education',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('candidate_id', GUID(), nullable=False),
    sa.Column('start', sa.Date(), nullable=True),
    sa.Column('end', sa.Date(), nullable=True),
    sa.Column('course', sa.String(length=512), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('degree_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
    sa.ForeignKeyConstraint(['degree_id'], [u'education_degree.id'], ),
    sa.ForeignKeyConstraint(['institution_id'], [u'institution.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    ### end Alembic commands ###
    bulk_insert_names("institution", 'institutions.csv')


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column(u'candidate', 'created')
    op.drop_table('candidate_education')
    op.drop_table('institution')
    ### end Alembic commands ###
