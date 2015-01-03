"""candidate current employers view

Revision ID: 3b921b4eb41d
Revises: 55e0cdfe7177
Create Date: 2015-01-03 15:41:43.782951

"""

# revision identifiers, used by Alembic.
revision = '3b921b4eb41d'
down_revision = '55e0cdfe7177'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("""
        CREATE VIEW public.v_candidate_current_employers
        AS
        select candidate_id, e.id current_employer_ids
                from work_experience we
                join company c
                   on c.id = we.company_id
                join employer e
                    on e.company_name = c.name
                where we.end is null;
    """)


def downgrade():
    op.execute("""DROP VIEW IF EXISTS public.v_candidate_current_employers;""")
