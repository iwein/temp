"""offer-properties email + phone



Revision ID: 3d172126fbd7

Revises: 43c53e5c33b1

Create Date: 2014-10-16 16:47:55.479000



"""



# revision identifiers, used by Alembic.

revision = '3d172126fbd7'

down_revision = '43c53e5c33b1'



from alembic import op

import sqlalchemy as sa





def upgrade():

    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('offer', sa.Column('email', sa.String(length=1024), nullable=True))
    op.add_column('offer', sa.Column('phone', sa.String(length=128), nullable=True))
    ### end Alembic commands ###



def downgrade():

    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('offer', 'phone')
    op.drop_column('offer', 'email')
    ### end Alembic commands ###

