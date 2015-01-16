"""referral tracking

Revision ID: 11fe1e4b96a1
Revises: 522d0ecb9e43
Create Date: 2015-01-14 16:55:03.342851

"""

# revision identifiers, used by Alembic.
revision = '11fe1e4b96a1'
down_revision = '522d0ecb9e43'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('referral',
                    sa.Column('sndr_email', sa.String(length=512), nullable=False),
                    sa.Column('sndr_name', sa.String(length=512), nullable=False),
                    sa.Column('rcvr_email', sa.String(length=512), nullable=False),
                    sa.Column('rcvr_name', sa.String(length=512), nullable=False),
                    sa.Column('last_sent', sa.DateTime(), nullable=False),
                    sa.Column('sent_count', sa.Integer(), nullable=False),
                    sa.PrimaryKeyConstraint('sndr_email', 'rcvr_email')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('referral')
    ### end Alembic commands ###