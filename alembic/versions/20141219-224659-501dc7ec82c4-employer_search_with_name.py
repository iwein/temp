"""employer search with name

Revision ID: 501dc7ec82c4
Revises: 16332f208b6
Create Date: 2014-12-19 22:46:59.155459

"""

# revision identifiers, used by Alembic.
revision = '501dc7ec82c4'
down_revision = '16332f208b6'

from alembic import op
import sqlalchemy as sa



def upgrade():
    op.execute("drop FUNCTION employer_search(techs varchar[], city_id int, company_types int[])")

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


def downgrade():
    op.execute("drop FUNCTION employer_search(techs varchar[], city_id int, cname varchar)")

    op.execute(sa.text("""
        create or replace FUNCTION employer_search(techs varchar[], city_id int, company_types int[]) RETURNS table (employer_id uuid, matched_tags varchar[])
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
        and e."agreedTos" is not NULL
        and (ci.id = city_id or city_id is null)
        group by e.id;
        END;
        $$ LANGUAGE plpgsql;
    """))
