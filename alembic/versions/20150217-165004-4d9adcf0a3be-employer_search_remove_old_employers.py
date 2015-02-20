"""employer search remove old employers

Revision ID: 4d9adcf0a3be
Revises: 15f4de12bc2d
Create Date: 2015-02-17 16:50:04.498498

"""

# revision identifiers, used by Alembic.
revision = '4d9adcf0a3be'
down_revision = '15f4de12bc2d'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute(sa.text("""
        create or replace FUNCTION suggested_employers(techs varchar[], city_id int, candidateid uuid) RETURNS table (employer_id uuid, matched_tags varchar[])
        AS $$

        BEGIN

        return query
        select e.id, array_agg(distinct s.name) as matched_tags
        from employer e
            join employer_office eo
                on eo.employer_id = e.id
            left join city ci
                on ci.id = eo.address_city_id
            join employer_skill es
                on e.id = es.employer_id
            join skill s
                on s.id = es.skill_id
            left join company c ON lower(e.company_name::text) = lower(c.name::text)
            left join work_experience we on c.id = we.company_id and we.candidate_id = candidateid
        where s.name = any(techs)
            and e.approved is not NULL
            and e."agreedTos" is not NULL
            and e.deleted is NULL
            and (ci.id = city_id or city_id is null)
            and we.id is NULL
        group by e.id
        limit 5;
        END;
        $$ LANGUAGE plpgsql;
    """))


def downgrade():
    op.execute('drop FUNCTION suggested_employers(techs varchar[], city_id int, candidateid uuid);')
