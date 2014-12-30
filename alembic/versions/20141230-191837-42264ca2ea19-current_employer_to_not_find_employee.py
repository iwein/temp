"""current employer to not find employee

Revision ID: 42264ca2ea19
Revises: eeeaa514909
Create Date: 2014-12-30 19:18:37.333641

"""

# revision identifiers, used by Alembic.
revision = '42264ca2ea19'
down_revision = 'eeeaa514909'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("""
        DROP FUNCTION IF EXISTS cn_candidate_search(term varchar(255), employer_id uuid);
        DROP VIEW IF EXISTS public.v_candidate_search;
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
                 cpl.candidate_id,
                 cast(array_agg(co.name) AS VARCHAR(400)) AS countries,
                 cast(array_agg(ci.name) AS VARCHAR(400)) AS cities
                   FROM candidate_preferred_location cpl
                 LEFT JOIN country co
                   ON co.iso = cpl.country_iso
                 LEFT JOIN city ci
                   ON ci.id = cpl.city_id
                   GROUP BY cpl.candidate_id
                 ) y
              ON y.candidate_id = c.id
            LEFT JOIN (
                select candidate_id, array_agg(employer_id) employer_ids
                from offer
                where accepted is not null
                group by candidate_id
            )o
            ON o.candidate_id = c.id
            LEFT JOIN (
                select candidate_id, array_agg(e.id) current_employer_ids
                from work_experience we
                join company c
                on c.id = we.company_id
                    join employer e
                on e.company_name = c.name
                where we.end is null
                group by candidate_id
            )ce
            ON ce.candidate_id = c.id
            WHERE cs.name = 'active';

        CREATE OR REPLACE FUNCTION cn_candidate_search(term varchar(255), employer_id uuid)
          RETURNS table (candidate_id uuid, status varchar(32)) AS $$
            BEGIN
            if employer_id is not null then
                    RETURN QUERY
                    SELECT distinct cs.id, cs.status
                    from public.v_candidate_search cs
                    where employer_id != any(current_employer_ids)
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


def downgrade():
    op.execute("""
        DROP VIEW IF EXISTS public.v_candidate_search;
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
            o.employer_ids
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
                 cpl.candidate_id,
                 cast(array_agg(co.name) AS VARCHAR(400)) AS countries,
                 cast(array_agg(ci.name) AS VARCHAR(400)) AS cities
                   FROM candidate_preferred_location cpl
                 LEFT JOIN country co
                   ON co.iso = cpl.country_iso
                 LEFT JOIN city ci
                   ON ci.id = cpl.city_id
                   GROUP BY cpl.candidate_id
                 ) y
              ON y.candidate_id = c.id
            left join (
                select candidate_id, array_agg(employer_id) employer_ids
                from offer
                where accepted is not null
                group by candidate_id
                )o
                on o.candidate_id = c.id;
    """)
    op.execute("""
        DROP FUNCTION IF EXISTS cn_candidate_search(term varchar(255), employer_id uuid);
        CREATE OR REPLACE FUNCTION cn_candidate_search(term varchar(255), employer_id uuid)
          RETURNS table (candidate_id uuid, status varchar(32)) AS $$
            BEGIN
            if employer_id is not null then
                    RETURN QUERY
                    SELECT distinct cs.id, cs.status
                    from public.v_candidate_search cs
                    where anon_search_index @@ to_tsquery(term)
                    or (employer_id = any(employer_ids) and search_index @@ to_tsquery(term));
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
