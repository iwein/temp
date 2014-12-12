"""unified login

Revision ID: 13c22d38e1ab
Revises: 53110169b017
Create Date: 2014-12-12 18:13:45.888544

"""

# revision identifiers, used by Alembic.
revision = '13c22d38e1ab'
down_revision = '53110169b017'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("""
            create table if not exists unified_login
            (
            table_name varchar(255) not null,
            email varchar(255) not null primary key,
            pwd character varying(128),
            pwdforgot_sent timestamp without time zone,
            pwdforgot_token uuid,
            created timestamp without time zone NOT NULL
            );

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



            DROP TRIGGER IF EXISTS trg_insert_unified_login ON candidate;
            CREATE TRIGGER trg_insert_unified_login
            AFTER INSERT OR UPDATE
            ON candidate
            FOR EACH ROW
            execute procedure trg_insert_unified_login();

            DROP TRIGGER IF EXISTS trg_insert_unified_login ON employer;
            CREATE TRIGGER trg_insert_unified_login
            AFTER INSERT OR UPDATE
            ON employer
            FOR EACH ROW
            execute procedure trg_insert_unified_login();



            update candidate
            set email = email;

            delete from employer_office
            where employer_id in (select id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                        );

            delete from employer_benefit
            where employer_id in (select id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                        );

            delete from employer_skill
            where employer_id in (select id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                        );

            delete from candidate_bookmark_employer
            where employer_id in (select id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                        );

            delete from candidate_employer_blacklist
            where employer_id in (select id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                        );

            delete from offer_benefit
            where offer_id in (select o.id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                    join offer o
                        on o.employer_id = e.id
                        );


            delete from offer_skill
            where offer_id in (select o.id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                    join offer o
                        on o.employer_id = e.id
                        );

            delete from offer
            where employer_id in (select id
                    from employer e
                    join unified_login ul
                        on e.email = ul.email
                        );

            delete from employer
            where email in (select email from unified_login);

            update employer
            set email = email;
    """)



def downgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_insert_unified_login ON candidate;")
    op.execute("DROP TRIGGER IF EXISTS trg_insert_unified_login ON employer;")
    op.execute("DROP FUNCTION trg_insert_unified_login();")
    op.execute("drop table if exists unified_login;")

