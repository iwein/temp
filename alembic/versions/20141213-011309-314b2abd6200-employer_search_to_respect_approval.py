"""employer search to respect approval

Revision ID: 314b2abd6200
Revises: 13c22d38e1ab
Create Date: 2014-12-13 01:13:09.597904

"""

# revision identifiers, used by Alembic.
revision = '314b2abd6200'
down_revision = '13c22d38e1ab'

from alembic import op
import sqlalchemy as sa


def upgrade():
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


def downgrade():
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
        and (ci.id = city_id or city_id is null)
        group by e.id;
        END;
        $$ LANGUAGE plpgsql;
    """))
