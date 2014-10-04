"""searching

Revision ID: 397b66debe45
Revises: 24dcdfa58275
Create Date: 2014-09-25 19:21:33.684000

"""

# revision identifiers, used by Alembic.
from scotty.models import GUID

revision = '397b66debe45'
down_revision = '24dcdfa58275'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('offer', sa.Column('message', sa.Text(), nullable=False))
    op.add_column('offer', sa.Column('rejected_text', sa.Text(), nullable=True))
    op.create_table('candidate_employer_blacklist',
                    sa.Column('candidate_id', GUID(), nullable=False),
                    sa.Column('employer_id', GUID(), nullable=False),
                    sa.Column('created', sa.DateTime(), server_default='now()', nullable=False),
                    sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
                    sa.ForeignKeyConstraint(['employer_id'], ['employer.id'], ),
                    sa.PrimaryKeyConstraint('candidate_id', 'employer_id')
    )

    op.execute(sa.text("alter table city add geog geography;"))
    op.execute(sa.text("update city set geog = st_GeogFromText('SRID=4326;POINT(' || longitude || ' ' || latitude || ')');"))
    op.execute(sa.text("""
        create or replace FUNCTION candidate_search(skills varchar[], p_city_id int) RETURNS table (candidate_id uuid, matched_tags varchar[])
        AS $$

        declare city_geog geography;
                l_country_iso varchar;
        BEGIN

        city_geog = st_GeogFromText('SRID=4326;POINT(' || longitude || ' ' || latitude || ')')
        from city
        where id = p_city_id;

        l_country_iso = country_iso
        from city
        where id = p_city_id;

        return query
        select c.id as id,
        array_agg(distinct s.name) as matched_tags
        from candidate c
        join candidate_skill cs
            on c.id = cs.candidate_id
        join skill s
            on s.id = cs.skill_id
        join candidate_preferred_location cpl
            on cpl.candidate_id = c.id
        left join country co
            on cpl.country_iso = co.iso
        left join city ci
            on ci.id = cpl.city_id
        where s.name = any(skills)
        and (ST_Distance(city_geog, ci.geog) < 50000 or p_city_id is null)
        or co.iso = l_country_iso
        group by c.id;
        END;
        $$ LANGUAGE plpgsql;
    """))
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


def downgrade():
    op.drop_table('candidate_employer_blacklist')
    op.drop_column('offer', 'message')
    op.drop_column('offer', 'rejected_text')
    op.execute(sa.text("alter table city drop column geog;"))
    op.execute(sa.text("drop FUNCTION candidate_search(skills varchar[], p_city_id int);"))
    op.execute(sa.text("drop FUNCTION employer_search(techs varchar[], city_id int, company_types int[]);"))