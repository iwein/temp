"""sprint5

Revision ID: 24dcdfa58275
Revises: 1c0d55359623
Create Date: 2014-09-23 20:28:12.115000

"""

# revision identifiers, used by Alembic.
from scotty.models import GUID
from scotty.models.tools import csv_inserter

revision = '24dcdfa58275'
down_revision = '1c0d55359623'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('travelwillingness',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=64), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('name')
    )

    bulk_insert_names = csv_inserter(__file__)
    bulk_insert_names("travelwillingness", 'travelwillingness.csv')

    op.create_table('target_position_skills',
                    sa.Column('target_position_id', sa.Integer(), nullable=False),
                    sa.Column('skill_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['skill_id'], ['skill.id'], ),
                    sa.ForeignKeyConstraint(['target_position_id'], ['target_position.id'], ),
                    sa.PrimaryKeyConstraint('target_position_id', 'skill_id')
    )
    op.add_column(u'target_position', sa.Column('relocate', sa.Boolean(), nullable=True))
    op.add_column(u'target_position', sa.Column('travel_willingness_id', sa.Integer(), server_default='1', nullable=False))
    op.drop_column(u'target_position', 'skill_id')
    op.drop_column(u'target_position', 'seniority_id')
    op.drop_column(u'target_position', 'benefits')

    op.create_table('candidate_preferred_location',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('candidate_id', GUID(), nullable=True),
    sa.Column('country_iso', sa.String(length=2), nullable=True),
    sa.Column('city_id', sa.Integer(), nullable=True),
    sa.CheckConstraint('country_iso ISNULL and city_id NOTNULL or country_iso NOTNULL and city_id ISNULL', name='candidate_preferred_location_has_some_fk'),
    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
    sa.ForeignKeyConstraint(['city_id'], ['city.id'], ),
    sa.ForeignKeyConstraint(['country_iso'], [u'country.iso'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('candidate_id', 'city_id', name='candidate_preferred_location_city_unique'),
    sa.UniqueConstraint('candidate_id', 'country_iso', name='candidate_preferred_location_country_unique')
    )

    op.add_column('work_experience', sa.Column('city', sa.String(length=512), nullable=True))
    op.add_column('work_experience', sa.Column('country_iso', sa.String(length=2), nullable=False))
    op.drop_column('work_experience', 'city_id')

    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column(u'target_position', sa.Column('benefits', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column(u'target_position', sa.Column('seniority_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column(u'target_position', sa.Column('skill_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.drop_column(u'target_position', 'travel_willingness_id')
    op.drop_column(u'target_position', 'relocate')
    op.drop_table('target_position_skills')
    op.drop_table('travelwillingness')

    op.drop_table('candidate_preferred_location')

    op.add_column('work_experience', sa.Column('city_id', sa.INTEGER(), autoincrement=False, nullable=False))
    op.drop_column('work_experience', 'country_iso')
    op.drop_column('work_experience', 'city')

    ### end Alembic commands ###
