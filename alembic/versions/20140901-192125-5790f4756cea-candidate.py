"""candidate

Revision ID: 5790f4756cea
Revises: 1dc1c0a7ee4c
Create Date: 2014-09-01 19:21:25.535000

"""

# revision identifiers, used by Alembic.
from scotty.models import GUID
from scotty.models.tools import csv_inserter

revision = '5790f4756cea'
down_revision = '1dc1c0a7ee4c'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('candidatestatus',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=20), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('name')
    )
    op.create_table('candidate',
                    sa.Column('id', GUID(), nullable=False),
                    sa.Column('created', sa.DateTime(), nullable=False),
                    sa.Column('activated', sa.DateTime(), nullable=True),
                    sa.Column('activation_sent', sa.DateTime(), nullable=True),
                    sa.Column('activation_token', GUID(), nullable=True),
                    sa.Column('email', sa.String(length=512), nullable=False),
                    sa.Column('pwd', sa.String(length=128), nullable=False),
                    sa.Column('first_name', sa.String(length=512), nullable=False),
                    sa.Column('last_name', sa.String(length=512), nullable=False),
                    sa.Column('dob', sa.Date(), nullable=True),
                    sa.Column('pob', sa.String(length=512), nullable=True),
                    sa.Column('picture_url', sa.String(length=1024), nullable=True),
                    sa.Column('title_id', sa.Integer(), nullable=True),
                    sa.Column('residence_country_iso', sa.String(length=2), nullable=True),
                    sa.Column('summary', sa.Text(), nullable=True),
                    sa.Column('github_url', sa.String(length=1024), nullable=True),
                    sa.Column('stackoverflow_url', sa.String(length=1024), nullable=True),
                    sa.Column('traffic_source_id', sa.Integer(), nullable=True),
                    sa.Column('contact_line1', sa.String(length=512), nullable=True),
                    sa.Column('contact_line2', sa.String(length=512), nullable=True),
                    sa.Column('contact_line3', sa.String(length=512), nullable=True),
                    sa.Column('contact_zipcode', sa.String(length=20), nullable=True),
                    sa.Column('contact_city_id', sa.Integer(), nullable=True),
                    sa.Column('contact_phone', sa.String(length=128), nullable=True),
                    sa.Column('contact_skype', sa.String(length=255), nullable=True),
                    sa.Column('available_date', sa.Date(), nullable=True),
                    sa.Column('notice_period_number', sa.Integer(), nullable=True),
                    sa.Column('notice_period_measure', sa.String(length=1), server_default='w', nullable=False),
                    sa.Column('status_id', sa.Integer(), nullable=False),
                    sa.Column('willing_to_travel', sa.Boolean(), nullable=True),
                    sa.Column('dont_care_location', sa.Boolean(), nullable=True),
                    sa.ForeignKeyConstraint(['contact_city_id'], [u'city.id'], ),
                    sa.ForeignKeyConstraint(['residence_country_iso'], [u'country.iso'], ),
                    sa.ForeignKeyConstraint(['status_id'], [u'candidatestatus.id'], ),
                    sa.ForeignKeyConstraint(['title_id'], [u'title.id'], ),
                    sa.ForeignKeyConstraint(['traffic_source_id'], [u'traffic_source.id'], ),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('email'),
                    sa.UniqueConstraint('activation_token')
    )
    op.create_table('education',
                    sa.Column('created', sa.DateTime(), nullable=False),
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('candidate_id', GUID(), nullable=False),
                    sa.Column('start', sa.Date(), nullable=False),
                    sa.Column('end', sa.Date(), nullable=True),
                    sa.Column('course_id', sa.Integer(), nullable=False),
                    sa.Column('institution_id', sa.Integer(), nullable=False),
                    sa.Column('degree_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
                    sa.ForeignKeyConstraint(['degree_id'], [u'degree.id'], ),
                    sa.ForeignKeyConstraint(['institution_id'], [u'institution.id'], ),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('candidate_id', 'institution_id', 'start', name='candidate_education_unique')
    )
    op.create_table('candidate_skill',
                    sa.Column('candidate_id', GUID(), nullable=False),
                    sa.Column('created', sa.DateTime(), nullable=False),
                    sa.Column('skill_id', sa.Integer(), nullable=False),
                    sa.Column('level_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
                    sa.ForeignKeyConstraint(['level_id'], [u'skill_level.id'], ),
                    sa.ForeignKeyConstraint(['skill_id'], [u'skill.id'], ),
                    sa.PrimaryKeyConstraint('candidate_id', 'skill_id')
    )
    op.create_table('work_experience',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('candidate_id', GUID(), nullable=False),
                    sa.Column('created', sa.DateTime(), nullable=False),
                    sa.Column('start', sa.Date(), nullable=False),
                    sa.Column('end', sa.Date(), nullable=True),
                    sa.Column('summary', sa.Text(), nullable=False),
                    sa.Column('company_id', sa.Integer(), nullable=False),
                    sa.Column('city_id', sa.Integer(), nullable=False),
                    sa.Column('role_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
                    sa.ForeignKeyConstraint(['city_id'], [u'city.id'], ),
                    sa.ForeignKeyConstraint(['company_id'], [u'company.id'], ),
                    sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('candidate_id', 'company_id', 'start', name='candidate_work_experience_unique')
    )
    op.create_table('candidate_preferred_city',
                    sa.Column('candidate_id', GUID(), nullable=False),
                    sa.Column('city_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
                    sa.ForeignKeyConstraint(['city_id'], ['city.id'], ),
                    sa.PrimaryKeyConstraint('candidate_id', 'city_id')
    )
    op.create_table('candidate_language',
                    sa.Column('candidate_id', GUID(), nullable=False),
                    sa.Column('language_id', sa.Integer(), nullable=False),
                    sa.Column('proficiency_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
                    sa.ForeignKeyConstraint(['language_id'], [u'language.id'], ),
                    sa.ForeignKeyConstraint(['proficiency_id'], [u'proficiency.id'], ),
                    sa.PrimaryKeyConstraint('candidate_id', 'language_id')
    )
    op.create_table('target_position',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('candidate_id', GUID(), nullable=False),
                    sa.Column('created', sa.DateTime(), nullable=False),
                    sa.Column('role_id', sa.Integer(), nullable=False),
                    sa.Column('skill_id', sa.Integer(), nullable=False),
                    sa.Column('seniority_id', sa.Integer(), nullable=True),
                    sa.Column('minimum_salary', sa.Integer(), nullable=False),
                    sa.Column('benefits', sa.Text(), nullable=True),
                    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
                    sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
                    sa.ForeignKeyConstraint(['seniority_id'], [u'seniority.id'], ),
                    sa.ForeignKeyConstraint(['skill_id'], ['skill.id'], ),
                    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('target_position_company_type',
                    sa.Column('target_position_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['target_position_id'], ['target_position.id'], ),
                    sa.Column('company_type_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['company_type_id'], ['company_type.id'], ),
                    sa.PrimaryKeyConstraint('target_position_id', 'company_type_id')
    )
    op.create_table('work_experience_skill',
                    sa.Column('work_experience_id', sa.Integer(), nullable=False),
                    sa.Column('skill_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['skill_id'], ['skill.id'], ),
                    sa.ForeignKeyConstraint(['work_experience_id'], ['work_experience.id'], ),
                    sa.PrimaryKeyConstraint('work_experience_id', 'skill_id')
    )

    op.create_table('benefit',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=128), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('name')
    )
    ### end Alembic commands ###

    bulk_insert_names = csv_inserter(__file__)
    bulk_insert_names("institution", 'institutions.csv')
    bulk_insert_names("company", 'companies.csv')
    bulk_insert_names("candidatestatus", 'candidatestatus.csv')
    bulk_insert_names("traffic_source", 'traffic_sources.csv')
    bulk_insert_names("seniority", 'seniority.csv')
    bulk_insert_names("benefit", 'benefits.csv')

    ### commands auto generated by Alembic - please adjust! ###

def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('target_position_company_type')
    op.drop_table('target_position')
    op.drop_table('candidate_language')
    op.drop_table('candidate_preferred_city')
    op.drop_table('work_experience_skill')
    op.drop_table('work_experience')
    op.drop_table('candidate_skill')
    op.drop_table('education')
    op.drop_table('candidate')
    op.drop_table('candidatestatus')
    op.drop_table('benefit')
    ### end Alembic commands ###
