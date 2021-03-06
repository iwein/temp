"""country iso not required



Revision ID: 1dc0099a963e

Revises: 46a272d780af

Create Date: 2014-10-10 20:33:46.136000



"""



# revision identifiers, used by Alembic.

revision = '1dc0099a963e'

down_revision = '46a272d780af'



from alembic import op

import sqlalchemy as sa





def upgrade():

    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('work_experience', 'country_iso',
               existing_type=sa.VARCHAR(length=2),
               nullable=True,
               existing_server_default="DE'::character varying")
    ### end Alembic commands ###





def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('work_experience', 'country_iso',
               existing_type=sa.VARCHAR(length=2),
               nullable=False,
               existing_server_default="DE'::character varying")
    ### end Alembic commands ###

