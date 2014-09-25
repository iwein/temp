"""searching

Revision ID: 397b66debe45
Revises: 24dcdfa58275
Create Date: 2014-09-25 19:21:33.684000

"""

# revision identifiers, used by Alembic.
revision = '397b66debe45'
down_revision = '24dcdfa58275'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute(sa.text("""
        alter table city add geog geography;
        update city set geog = st_GeogFromText('SRID=4326;POINT(' || longitude || ' ' || latitude || ')');


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


def downgrade():
    op.execute(sa.text("""
        alter table city drop column geog;
        drop FUNCTION candidate_search(skills varchar[], p_city_id int);
    """))