"""nullables on education



Revision ID: 3e054601fee6

Revises: 5018de3ec549

Create Date: 2014-10-15 19:57:49.852000



"""



# revision identifiers, used by Alembic.

revision = '3e054601fee6'

down_revision = '5018de3ec549'



from alembic import op

import sqlalchemy as sa





def upgrade():

    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('education', 'course_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    ### end Alembic commands ###





def downgrade():

    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('education', 'course_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    ### end Alembic commands ###
