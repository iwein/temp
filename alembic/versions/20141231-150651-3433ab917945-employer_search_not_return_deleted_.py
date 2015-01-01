"""employer search not return deleted employers

Revision ID: 3433ab917945
Revises: 12898b381007
Create Date: 2014-12-31 15:06:51.560134

"""

# revision identifiers, used by Alembic.
revision = '3433ab917945'
down_revision = '12898b381007'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute(sa.text("""
        create or replace FUNCTION employer_search(techs varchar[], city_id int, cname varchar) RETURNS table (employer_id uuid, matched_tags varchar[])
        AS $$

        BEGIN

        return query
        select e.id,
        array_agg(distinct s.name) as matched_tags
        from employer e
        join employer_office eo
            on eo.employer_id = e.id
        left join city ci
            on ci.id = eo.address_city_id
        join employer_skill es
            on e.id = es.employer_id
        join skill s
            on s.id = es.skill_id
        where s.name = any(techs) and (cname is null or lower(e.company_name) like (cname || '%'))
        and e.approved is not NULL
        and e."agreedTos" is not NULL
        and e.deleted is NULL
        and (ci.id = city_id or city_id is null)
        group by e.id;
        END;
        $$ LANGUAGE plpgsql;
    """))

def downgrade():
    op.execute("drop FUNCTION employer_search(techs varchar[], city_id int, cname varchar) ")

    op.execute(sa.text("""
        create or replace FUNCTION employer_search(techs varchar[], city_id int, cname varchar) RETURNS table (employer_id uuid, matched_tags varchar[])
        AS $$

        BEGIN

        return query
        select e.id,
        array_agg(distinct s.name) as matched_tags
        from employer e
        join employer_office eo
            on eo.employer_id = e.id
        left join city ci
            on ci.id = eo.address_city_id
        join employer_skill es
            on e.id = es.employer_id
        join skill s
            on s.id = es.skill_id
        where s.name = any(techs)
        and e.approved is not NULL
        and (cname is null or lower(e.company_name) like (cname || '%'))
        and e."agreedTos" is not NULL
        and (ci.id = city_id or city_id is null)
        group by e.id;
        END;
        $$ LANGUAGE plpgsql;
    """))