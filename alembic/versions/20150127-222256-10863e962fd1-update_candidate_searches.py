"""update candidate searches

Revision ID: 10863e962fd1
Revises: 649031fee6b
Create Date: 2015-01-27 22:22:56.987430

"""

# revision identifiers, used by Alembic.
revision = '10863e962fd1'
down_revision = '649031fee6b'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("DROP FUNCTION IF EXISTS cn_candidate_search(term varchar(255), employer_id uuid);")
    op.execute("DROP VIEW IF EXISTS public.v_candidate_search;")
    op.execute("DROP VIEW IF EXISTS public.v_candidate_current_employers;")

    op.execute("""
        CREATE VIEW public.v_candidate_current_employers
        AS
        select candidate_id, e.id employer_id
                from work_experience we
                join company c
                   on c.id = we.company_id
                join employer e
                    on lower(e.company_name) = lower(c.name)
                where we.end is null;
    """)

    op.execute("""
        CREATE VIEW public.v_candidate_search
        AS

        SELECT
            c.id,
            cs.name as status,
            to_tsvector(cast(c.id AS VARCHAR(34)) || ', ' ||
            c.first_name || ' ' || c.last_name || ', ' || x.skills || ', ' || y.countries
            || ', ' || y.cities) AS search_index,
            to_tsvector(cast(c.id AS VARCHAR(34)) || ', ' ||
            case when c.anonymous = true then '' else c.first_name || ' ' || c.last_name end
             || ', ' || x.skills || ', ' || y.countries
            || ', ' || y.cities) AS anon_search_index,
            o.employer_ids,
            ce.current_employer_ids
              FROM candidate c
            JOIN target_position tp
              ON c.id = tp.candidate_id
            JOIN role r
              ON r.id = tp.role_id
            JOIN candidatestatus cs
              ON cs.id = c.status_id
            JOIN (
                   SELECT
                 candidate_id,
                 cast(array_agg(s.name) AS VARCHAR(400)) skills
                   FROM candidate_skill cskill
                 join skill s on s.id = cskill.skill_id
                   GROUP BY candidate_id
                 ) x
              ON x.candidate_id = c.id
            JOIN (
                   SELECT
                 cpl.target_position_candidate_id AS candidate_id,
                 cast(array_agg(co.name) AS VARCHAR(400)) AS countries,
                 cast(array_agg(ci.name) AS VARCHAR(400)) AS cities
                   FROM candidate_preferred_location cpl
                 LEFT JOIN country co
                   ON co.iso = cpl.country_iso
                 LEFT JOIN city ci
                   ON ci.id = cpl.city_id
                   GROUP BY cpl.target_position_candidate_id
                 ) y
              ON y.candidate_id = c.id
            left join (
                select candidate_id, array_agg(employer_id) employer_ids
                from offer
                where accepted is not null
                group by candidate_id
                )o
                on o.candidate_id = c.id
            left join
            (
                select candidate_id, array_agg(e.employer_id) current_employer_ids
                from v_candidate_current_employers e
                group by candidate_id
            )ce
                on ce.candidate_id = c.id
            where cs.name = 'active';


        CREATE OR REPLACE FUNCTION cn_candidate_search(term varchar(255), employer_id uuid)
          RETURNS table (candidate_id uuid, status varchar(32)) AS $$
            BEGIN
            if employer_id is not null then
                    RETURN QUERY
                    SELECT distinct cs.id, cs.status
                    from public.v_candidate_search cs
                    where (current_employer_ids is null or employer_id != any(current_employer_ids))
                    and (anon_search_index @@ to_tsquery(term)
                    or (employer_id = any(employer_ids) and search_index @@ to_tsquery(term)));
                else
                    RETURN QUERY
                    SELECT distinct cs.id, cs.status
                    from public.v_candidate_search cs
                    where anon_search_index @@ to_tsquery(term);
            end if;
           END;
           $$
          LANGUAGE plpgsql VOLATILE
          COST 100;
    """)

    op.execute(sa.text("DROP FUNCTION IF EXISTS candidate_search(skills varchar[], p_city_id int);"))
    op.execute(sa.text("""
        create or replace FUNCTION candidate_search(skills varchar[], p_city_id int, p_status_id int) RETURNS table (candidate_id uuid, matched_tags varchar[])
        AS $$

        DECLARE
                city_geog geography;
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
            on cpl.target_position_candidate_id = c.id
        left join country co
            on cpl.country_iso = co.iso
        left join city ci
            on ci.id = cpl.city_id
        where s.name = any(skills)
        and (status_id = p_status_id or p_status_id is null)
        and (ST_Distance(city_geog, ci.geog) < 50000 or p_city_id is null)
        or co.iso = l_country_iso
        group by c.id;
        END;
        $$ LANGUAGE plpgsql;
    """))

   ### end Alembic commands ###


def downgrade():
    pass