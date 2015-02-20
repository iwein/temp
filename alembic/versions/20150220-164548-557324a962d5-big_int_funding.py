"""big int funding

Revision ID: 557324a962d5
Revises: 4d9adcf0a3be
Create Date: 2015-02-20 16:45:48.150583

"""

# revision identifiers, used by Alembic.
revision = '557324a962d5'
down_revision = '4d9adcf0a3be'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("alter table target_position alter column minimum_salary TYPE BIGINT;")
    op.execute("alter table employer alter column revenue_pa TYPE BIGINT;")
    op.execute("alter table employer alter column funding_amount TYPE BIGINT;")



    ### end Alembic commands ###


def downgrade():
    pass