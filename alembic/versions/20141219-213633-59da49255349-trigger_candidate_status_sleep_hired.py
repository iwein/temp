"""trigger candidate status sleep hired

Revision ID: 59da49255349
Revises: 4ea9462296b1
Create Date: 2014-12-19 21:36:33.784939

"""

# revision identifiers, used by Alembic.
revision = '59da49255349'
down_revision = '4ea9462296b1'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("""
        CREATE OR REPLACE FUNCTION trg_update_candidate_status()
            RETURNS trigger AS
            $BODY$
            BEGIN
            IF TG_OP = 'UPDATE' and  (NEW).job_start_date is not null then
                update candidate
                set status_id = (select id from candidatestatus where name = 'sleeping')
                where id = (NEW).candidate_id;
            end if;
            RETURN NULL;
            END;
            $BODY$
        LANGUAGE plpgsql VOLATILE;

        DROP TRIGGER IF EXISTS trg_update_candidate_status ON offer;

        CREATE TRIGGER trg_insert_unified_login
            AFTER UPDATE
            ON offer
            FOR EACH ROW
            execute procedure trg_update_candidate_status();

        update offer set job_start_date = job_start_date;
    """)
    op.execute("""drop view v_hired_candidate""")


def downgrade():
    op.execute("DROP FUNCTION trg_update_candidate_status() cascade;")
    op.execute("DROP TRIGGER IF EXISTS trg_update_candidate_status ON offer;")
    op.execute("""create or replace view v_hired_candidate
                as
                select candidate_id as id
                from offer
                group by candidate_id
                having max(job_start_date) > date_trunc('day', NOW() - interval '6 month');""")
