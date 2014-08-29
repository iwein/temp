"""Employer

Revision ID: 55ad3d8e8139
Revises: 42a98c87c1c7
Create Date: 2014-08-29 19:44:46.236000

"""

# revision identifiers, used by Alembic.
from scotty.models import GUID
from scotty.models.tools import csv_inserter

revision = '55ad3d8e8139'
down_revision = '42a98c87c1c7'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('employer_status',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=20), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('employer',
    sa.Column('id', GUID(), nullable=False),
    sa.Column('company_name', sa.String(length=255), nullable=False),
    sa.Column('created', sa.Date(), nullable=False),
    sa.Column('website', sa.String(length=512), nullable=True),
    sa.Column('address_line1', sa.String(length=512), nullable=True),
    sa.Column('address_line2', sa.String(length=512), nullable=True),
    sa.Column('address_line3', sa.String(length=512), nullable=True),
    sa.Column('address_zipcode', sa.String(length=20), nullable=True),
    sa.Column('address_city_id', sa.Integer(), nullable=True),
    sa.Column('contact_name', sa.String(length=255), nullable=True),
    sa.Column('contact_phone', sa.String(length=32), nullable=True),
    sa.Column('contact_email', sa.String(length=1024), nullable=True),
    sa.Column('contact_position', sa.String(length=128), nullable=True),
    sa.Column('logo_url', sa.String(length=512), nullable=True),
    sa.Column('image_video_url', sa.String(length=1024), nullable=True),
    sa.Column('mission_text', sa.Text(), nullable=True),
    sa.Column('culture_text', sa.Text(), nullable=True),
    sa.Column('vision_text', sa.Text(), nullable=True),
    sa.Column('founding_date', sa.Date(), nullable=True),
    sa.Column('revenue_pa', sa.Integer(), nullable=True),
    sa.Column('funding', sa.Text(), nullable=True),
    sa.Column('no_of_employees', sa.Integer(), nullable=True),
    sa.Column('tech_team_size', sa.Integer(), nullable=True),
    sa.Column('tech_team_philosophy', sa.Text(), nullable=True),
    sa.Column('benefits', sa.Text(), nullable=True),
    sa.Column('status_id', sa.Integer(), nullable=False),
    sa.Column('external_rating', sa.Integer(), nullable=True),
    sa.Column('featured', sa.Boolean(), nullable=True),
    sa.Column('recruitment_process', sa.Text(), nullable=True),
    sa.Column('traffic_source_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['address_city_id'], [u'city.id'], ),
    sa.ForeignKeyConstraint(['status_id'], [u'employer_status.id'], ),
    sa.ForeignKeyConstraint(['traffic_source_id'], [u'traffic_source.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('employer_office',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employer_id', GUID(), nullable=False),
    sa.Column('created', sa.Date(), nullable=False),
    sa.Column('website', sa.String(length=512), nullable=True),
    sa.Column('address_line1', sa.String(length=512), nullable=False),
    sa.Column('address_line2', sa.String(length=512), nullable=True),
    sa.Column('address_line3', sa.String(length=512), nullable=True),
    sa.Column('address_zipcode', sa.String(length=20), nullable=False),
    sa.Column('address_city_id', sa.Integer(), nullable=False),
    sa.Column('contact_name', sa.String(length=255), nullable=False),
    sa.Column('contact_phone', sa.String(length=32), nullable=True),
    sa.Column('contact_email', sa.String(length=1024), nullable=False),
    sa.Column('contact_position', sa.String(length=128), nullable=True),
    sa.ForeignKeyConstraint(['address_city_id'], [u'city.id'], ),
    sa.ForeignKeyConstraint(['employer_id'], ['employer.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('employer_user',
    sa.Column('id', GUID(), nullable=False),
    sa.Column('employer_id', GUID(), nullable=False),
    sa.Column('created', sa.Date(), nullable=False),
    sa.Column('name', sa.String(length=512), nullable=True),
    sa.Column('email', sa.String(length=512), nullable=False),
    sa.Column('pwd', sa.String(length=128), nullable=False),
    sa.ForeignKeyConstraint(['employer_id'], ['employer.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    ### end Alembic commands ###

    bulk_insert_names = csv_inserter(__file__)
    bulk_insert_names("employer_status", 'employer_status.csv')


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('employer_user')
    op.drop_table('employer_office')
    op.drop_table('employer')
    op.drop_table('employer_status')
    ### end Alembic commands ###
