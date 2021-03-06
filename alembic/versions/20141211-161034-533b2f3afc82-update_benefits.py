"""update benefits

Revision ID: 533b2f3afc82
Revises: 8daffc86869
Create Date: 2014-12-11 16:10:34.984266

"""

# revision identifiers, used by Alembic.
from scotty.models.tools import csv_inserter

revision = '533b2f3afc82'
down_revision = '8daffc86869'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.execute("delete from offer_benefit;")
    op.execute("delete from employer_benefit;")
    op.execute("delete from benefit;")
    bulk_insert_names = csv_inserter(__file__)
    bulk_insert_names("benefit", 'benefits_2.csv')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.execute("delete from offer_benefit;")
    op.execute("delete from employer_benefit;")
    op.execute("delete from benefit;")
    bulk_insert_names = csv_inserter(__file__)
    bulk_insert_names("benefit", 'benefits.csv')

    ### end Alembic commands ###
