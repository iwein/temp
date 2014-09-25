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

    op.create_table('office_type',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=20), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('name')
    )
    bulk_insert_names = csv_inserter(__file__)
    bulk_insert_names("travelwillingness", 'travelwillingness.csv')
    bulk_insert_names("office_type", 'office_types.csv')

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
    op.add_column('work_experience', sa.Column('country_iso', sa.String(length=2), nullable=False, server_default='DE'))
    op.drop_column('work_experience', 'city_id')

    op.alter_column('candidate_skill', 'level_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)

    op.execute('ALTER TABLE education ALTER COLUMN start TYPE INTEGER USING EXTRACT(YEAR from start)')
    op.execute('ALTER TABLE education ALTER COLUMN "end" TYPE INTEGER USING EXTRACT(YEAR from "end")')
    op.execute('ALTER TABLE degree ALTER "name" TYPE VARCHAR(255)')
    op.alter_column('education', 'degree_id', existing_type=sa.INTEGER(), nullable=True)

    op.add_column('candidate', sa.Column('contact_city', sa.String(length=512), nullable=True))
    op.add_column('candidate', sa.Column('contact_country_iso', sa.String(length=2), nullable=True))
    op.drop_column('candidate', 'notice_period_measure')
    op.drop_column('candidate', 'contact_city_id')

    op.drop_column('candidate', 'residence_country_iso')
    op.drop_column('candidate', 'willing_to_travel')
    op.drop_column('candidate', 'dont_care_location')

    op.add_column('candidate', sa.Column('availability', sa.Text(), nullable=True))
    op.drop_column('candidate', 'notice_period_number')
    op.drop_column('candidate', 'available_date')

    op.execute('alter table title rename to salutation;')
    op.add_column('candidate', sa.Column('salutation_id', sa.Integer(), nullable=True))
    op.drop_column('candidate', 'title_id')

    op.add_column('employer', sa.Column('contact_first_name', sa.String(length=255), nullable=True))
    op.add_column('employer', sa.Column('contact_last_name', sa.String(length=255), nullable=True))
    op.add_column('employer', sa.Column('contact_salutation_id', sa.Integer(), nullable=True))
    op.drop_column('employer', 'contact_name')


    op.drop_column(u'employer', 'address_line2')
    op.drop_column(u'employer', 'address_line3')
    op.drop_column(u'employer', 'address_line1')
    op.drop_column(u'employer', 'address_city_id')
    op.drop_column(u'employer', 'contact_position')
    op.drop_column(u'employer', 'address_zipcode')
    op.drop_column(u'employer', 'contact_email')
    op.drop_column(u'employer', 'contact_phone')
    op.add_column(u'employer_office', sa.Column('contact_first_name', sa.String(length=255), nullable=True))
    op.add_column(u'employer_office', sa.Column('contact_last_name', sa.String(length=255), nullable=True))
    op.add_column(u'employer_office', sa.Column('contact_salutation_id', sa.Integer(), nullable=True))
    op.add_column(u'employer_office', sa.Column('type_id', sa.Integer(), nullable=False, server_default="2"))
    op.drop_column(u'employer_office', 'contact_name')

    op.add_column('candidate', sa.Column('pwdforgot_sent', sa.DateTime(), nullable=True))
    op.add_column('candidate', sa.Column('pwdforgot_token', GUID(), nullable=True))
    op.create_unique_constraint(None, 'candidate', ['pwdforgot_token'])
    op.add_column('employer', sa.Column('pwdforgot_sent', sa.DateTime(), nullable=True))
    op.add_column('employer', sa.Column('pwdforgot_token', GUID(), nullable=True))
    op.create_unique_constraint(None, 'employer', ['pwdforgot_token'])

    op.drop_table('candidate_preferred_city')

    op.add_column('offer', sa.Column('contract_received', sa.DateTime(), nullable=True))
    op.add_column('offer', sa.Column('contract_sent', sa.DateTime(), nullable=True))
    op.add_column('offer', sa.Column('contract_signed', sa.DateTime(), nullable=True))
    op.add_column('offer', sa.Column('interview', sa.DateTime(), nullable=True))
    op.add_column('offer', sa.Column('job_started', sa.DateTime(), nullable=True))

    op.add_column('employer', sa.Column('company_type_id', sa.Integer(), server_default='1', nullable=False))
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


    op.drop_column('work_experience', 'city')
    op.drop_column('work_experience', 'country_iso')
    op.add_column('work_experience', sa.Column('city_id', sa.INTEGER(), autoincrement=False, nullable=True))

    op.alter_column('candidate_skill', 'level_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)

    op.alter_column('education', 'degree_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)

    op.execute('ALTER TABLE education ALTER COLUMN start TYPE DATE USING to_date(to_char(start, \'9999\'), \'YYYY\')')
    op.execute('ALTER TABLE education ALTER COLUMN "end" TYPE DATE USING to_date(to_char("end", \'9999\'), \'YYYY\')')
    op.execute('ALTER TABLE degree ALTER "name" TYPE VARCHAR(20) USING substring("name" from 0 for 20)')

    op.add_column('candidate', sa.Column('contact_city_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('candidate', sa.Column('notice_period_measure', sa.VARCHAR(length=1), server_default="m", autoincrement=False, nullable=False))
    op.drop_column('candidate', 'contact_country_iso')
    op.drop_column('candidate', 'contact_city')

    op.add_column('candidate', sa.Column('residence_country_iso', sa.VARCHAR(length=2), autoincrement=False, nullable=True))

    op.add_column('candidate', sa.Column('dont_care_location', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('candidate', sa.Column('willing_to_travel', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('candidate', sa.Column('available_date', sa.DATE(), autoincrement=False, nullable=True))
    op.add_column('candidate', sa.Column('notice_period_number', sa.INTEGER(), autoincrement=False, nullable=True))
    op.drop_column('candidate', 'availability')

    op.add_column('candidate', sa.Column('title_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.drop_column('candidate', 'salutation_id')
    op.execute('alter table salutation rename to title;')


    op.add_column('employer', sa.Column('contact_name', sa.VARCHAR(length=255), autoincrement=False, nullable=True))
    op.drop_column('employer', 'contact_salutation_id')
    op.drop_column('employer', 'contact_last_name')
    op.drop_column('employer', 'contact_first_name')

    op.add_column(u'employer_office', sa.Column('contact_name', sa.VARCHAR(length=255), autoincrement=False, nullable=False, server_default='No Name'))
    op.drop_column(u'employer_office', 'type_id')
    op.drop_column(u'employer_office', 'contact_salutation_id')
    op.drop_column(u'employer_office', 'contact_last_name')
    op.drop_column(u'employer_office', 'contact_first_name')
    op.add_column(u'employer', sa.Column('contact_phone', sa.VARCHAR(length=32), autoincrement=False, nullable=True))
    op.add_column(u'employer', sa.Column('contact_email', sa.VARCHAR(length=1024), autoincrement=False, nullable=True))
    op.add_column(u'employer', sa.Column('address_zipcode', sa.VARCHAR(length=20), autoincrement=False, nullable=True))
    op.add_column(u'employer', sa.Column('contact_position', sa.VARCHAR(length=128), autoincrement=False, nullable=True))
    op.add_column(u'employer', sa.Column('address_city_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column(u'employer', sa.Column('address_line1', sa.VARCHAR(length=512), autoincrement=False, nullable=True))
    op.add_column(u'employer', sa.Column('address_line3', sa.VARCHAR(length=512), autoincrement=False, nullable=True))
    op.add_column(u'employer', sa.Column('address_line2', sa.VARCHAR(length=512), autoincrement=False, nullable=True))
    op.drop_table('office_type')

    op.drop_column('employer', 'pwdforgot_token')
    op.drop_column('employer', 'pwdforgot_sent')
    op.drop_column('candidate', 'pwdforgot_token')
    op.drop_column('candidate', 'pwdforgot_sent')

    op.create_table('candidate_preferred_city',
                    sa.Column('candidate_id', GUID(), autoincrement=False, nullable=False),
                    sa.Column('city_id', sa.INTEGER(), autoincrement=False, nullable=False),
                    sa.ForeignKeyConstraint(['candidate_id'], [u'candidate.id'], name=u'candidate_preferred_city_candidate_id_fkey'),
                    sa.ForeignKeyConstraint(['city_id'], [u'city.id'], name=u'candidate_preferred_city_city_id_fkey'),
                    sa.PrimaryKeyConstraint('candidate_id', 'city_id', name=u'candidate_preferred_city_pkey')
    )

    op.drop_column('offer', 'job_started')
    op.drop_column('offer', 'interview')
    op.drop_column('offer', 'contract_signed')
    op.drop_column('offer', 'contract_sent')
    op.drop_column('offer', 'contract_received')
    op.drop_column('employer', 'company_type_id')
    ### end Alembic commands ###
