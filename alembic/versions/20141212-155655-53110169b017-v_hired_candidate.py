"""v_hired_candidate



Revision ID: 53110169b017

Revises: 533b2f3afc82

Create Date: 2014-12-12 15:56:55.054000



"""



# revision identifiers, used by Alembic.

revision = '53110169b017'

down_revision = '533b2f3afc82'



from alembic import op

import sqlalchemy as sa

from sqlalchemy.dialects import postgresql



def upgrade():

   op.execute("""create or replace view v_hired_candidate
                as
                select candidate_id as id
                from offer
                group by candidate_id
                having max(job_start_date) > date_trunc('day', NOW() - interval '6 month');""")





def downgrade():

    op.execute("""drop view v_hired_candidate""")

