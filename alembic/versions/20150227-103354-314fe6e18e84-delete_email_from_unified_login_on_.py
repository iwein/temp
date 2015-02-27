"""delete email from unified login on delete

Revision ID: 314fe6e18e84
Revises: 28405ee14b74
Create Date: 2015-02-27 10:33:54.583770

"""

# revision identifiers, used by Alembic.
revision = '314fe6e18e84'
down_revision = '28405ee14b74'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    connection = op.get_bind()
    res = connection.execute("select id from candidatestatus where name = 'deleted'")
    deleted_id = list(res)[0][0]

    op.execute("DROP INDEX candidate_email_key;")
    op.execute("CREATE UNIQUE INDEX candidate_email_key  ON candidate (email) WHERE status_id != %s;" % deleted_id)

    #op.execute("ALTER TABLE employer DROP CONSTRAINT employer_email_key;")
    op.execute("DROP INDEX IF EXISTS employer_email_key;")
    op.execute("CREATE UNIQUE INDEX employer_email_key ON employer (email) WHERE deleted IS NULL")

    op.execute("DROP INDEX employer_company_name_key;")
    op.execute('CREATE UNIQUE INDEX employer_company_name_key '
               'ON employer (lower(company_name) ) WHERE deleted IS NULL')


    op.execute("""

        DROP TRIGGER IF EXISTS trg_insert_unified_login ON candidate;
        DROP TRIGGER IF EXISTS trg_insert_unified_login ON employer;

        CREATE OR REPLACE FUNCTION trg_insert_unified_login()
            RETURNS trigger AS
            $BODY$
            BEGIN

                IF TG_OP != 'INSERT' then
                    DELETE from unified_login
                    where email = (OLD).email;


                    IF (TG_TABLE_NAME = 'candidate') THEN IF EXISTS (select 1 from candidate c join candidatestatus cs on cs.id = c.status_id where cs.name = 'deleted' and c.id = (OLD).id) then
                            RAISE NOTICE 'EXIT !!!! VARIABLE %', TG_TABLE_NAME;
                            RETURN NULL;
                        END IF;
                    ELSIF (TG_TABLE_NAME = 'employer') THEN IF (OLD).deleted IS NOT NULL THEN
                            RAISE NOTICE 'EXIT ???? VARIABLE %', TG_TABLE_NAME;
                            RETURN NULL;
                        END IF;
                    END IF;

                end if;

                INSERT INTO unified_login
                (table_name, email, pwd, pwdforgot_sent, pwdforgot_token, created)
                SELECT tg_table_name,(NEW).email, (NEW).pwd, (NEW).pwdforgot_sent,
                (NEW).pwdforgot_token, (NEW).created;

                RETURN NULL;

            END;
            $BODY$
              LANGUAGE plpgsql VOLATILE;

            CREATE TRIGGER trg_insert_unified_login
            AFTER INSERT OR UPDATE
            ON candidate
            FOR EACH ROW
            execute procedure trg_insert_unified_login();

            CREATE TRIGGER trg_insert_unified_login
            AFTER INSERT OR UPDATE
            ON employer
            FOR EACH ROW
            execute procedure trg_insert_unified_login();
        """)

    op.execute("delete from unified_login where email in "
               "(select c.email from candidate c join candidatestatus cs ON cs.id = c.status_id WHERE cs.name = 'deleted')")
    op.execute("delete from unified_login where email in (select email from employer where deleted is Null)")
    ## end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.execute("""
        DROP TRIGGER IF EXISTS trg_insert_unified_login ON candidate;
        DROP TRIGGER IF EXISTS trg_insert_unified_login ON employer;

        CREATE OR REPLACE FUNCTION trg_insert_unified_login()
            RETURNS trigger AS
            $BODY$
            BEGIN

            IF TG_OP != 'INSERT' then
                DELETE from unified_login
                where email = (OLD).email;
            end if;

            INSERT INTO unified_login
            (table_name, email, pwd, pwdforgot_sent, pwdforgot_token, created)
            SELECT tg_table_name,(NEW).email, (NEW).pwd, (NEW).pwdforgot_sent,
            (NEW).pwdforgot_token, (NEW).created;

            RETURN NULL;

            END;
            $BODY$
              LANGUAGE plpgsql VOLATILE;



            CREATE TRIGGER trg_insert_unified_login
            AFTER INSERT OR UPDATE
            ON candidate
            FOR EACH ROW
            execute procedure trg_insert_unified_login();

            CREATE TRIGGER trg_insert_unified_login
            AFTER INSERT OR UPDATE
            ON employer
            FOR EACH ROW
            execute procedure trg_insert_unified_login();

    """)

    ### end Alembic commands ###
