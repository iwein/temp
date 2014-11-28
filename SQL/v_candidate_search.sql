DROP VIEW IF EXISTS public.v_candidate_search;
CREATE VIEW public.v_candidate_search
AS
  SELECT
    c.id,
    cs.name as status,
    cast(c.id AS VARCHAR(34)) || ', ' || c.first_name || ' ' || c.last_name || ', ' || x.skills || ', ' || y.countries
    || ', ' || y.cities AS search_index
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