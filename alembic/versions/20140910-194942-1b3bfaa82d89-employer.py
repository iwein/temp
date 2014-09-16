"""benefits

Revision ID: 1b3bfaa82d89
Revises: 5790f4756cea
Create Date: 2014-09-10 19:49:42.154000

"""

# revision identifiers, used by Alembic.
from scotty.models import GUID

revision = '1b3bfaa82d89'
down_revision = '5790f4756cea'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('benefit',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=128), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('employer',
    sa.Column('id', GUID(), nullable=False),
    sa.Column('company_name', sa.String(length=255), nullable=False),
    sa.Column('email', sa.String(length=512), nullable=False),
    sa.Column('pwd', sa.String(length=128), nullable=True),
    sa.Column('invite_token', GUID(), nullable=True),
    sa.Column('invite_sent', sa.Date(), nullable=True),
    sa.Column('created', sa.Date(), nullable=False),
    sa.Column('agreedTos', sa.Date(), nullable=True),
    sa.Column('approved', sa.Date(), nullable=True),
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
    sa.Column('recruitment_process', sa.Text(), nullable=True),
    sa.Column('training_policy', sa.Text(), nullable=True),
    sa.Column('founding_year', sa.Integer(), nullable=True),
    sa.Column('revenue_pa', sa.Integer(), nullable=True),
    sa.Column('funding_amount', sa.Integer(), nullable=True),
    sa.Column('funding_text', sa.Text(), nullable=True),
    sa.Column('no_of_employees', sa.Integer(), nullable=True),
    sa.Column('tech_team_size', sa.Integer(), nullable=True),
    sa.Column('tech_team_philosophy', sa.Text(), nullable=True),
    sa.Column('external_rating', sa.Integer(), nullable=True),
    sa.Column('featured', sa.Boolean(), nullable=True),
    sa.Column('traffic_source_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['address_city_id'], [u'city.id'], ),
    sa.ForeignKeyConstraint(['traffic_source_id'], [u'traffic_source.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('company_name'),
    sa.UniqueConstraint('email')
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
    op.create_table('employer_benefit',
    sa.Column('employer_id', GUID(), nullable=False),
    sa.Column('benefit_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['benefit_id'], ['benefit.id'], ),
    sa.ForeignKeyConstraint(['employer_id'], ['employer.id'], ),
    sa.PrimaryKeyConstraint('employer_id', 'benefit_id')
    )
    op.create_table('employer_skill',
    sa.Column('employer_id', GUID(), nullable=False),
    sa.Column('skill_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['employer_id'], ['employer.id'], ),
    sa.ForeignKeyConstraint(['skill_id'], ['skill.id'], ),
    sa.PrimaryKeyConstraint('employer_id', 'skill_id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('employer_skill')
    op.drop_table('employer_benefit')
    op.drop_table('employer_office')
    op.drop_table('employer')
    op.drop_table('benefit')
    ### end Alembic commands ###
