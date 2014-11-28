CREATE OR REPLACE FUNCTION candidate_search(skills VARCHAR [], p_city_id INT)
  RETURNS TABLE(candidate_id UUID, matched_tags VARCHAR [])
AS $$

DECLARE city_geog     geography;
        l_country_iso VARCHAR;
BEGIN

  city_geog = st_GeogFromText('SRID=4326;POINT(' || longitude || ' ' || latitude || ')')
  FROM city
  WHERE id = p_city_id;

  l_country_iso = country_iso FROM city WHERE id = p_city_id;

  RETURN QUERY
  SELECT
    c.id                       AS id,
    array_agg(DISTINCT s.name) AS matched_tags
  FROM candidate c
    JOIN candidate_skill cs
      ON c.id = cs.candidate_id
    JOIN skill s
      ON s.id = cs.skill_id
    JOIN candidate_preferred_location cpl
      ON cpl.candidate_id = c.id
    LEFT JOIN country co
      ON cpl.country_iso = co.iso
    LEFT JOIN city ci
      ON ci.id = cpl.city_id
  WHERE s.name = ANY (skills)
        AND (ST_Distance(city_geog, ci.geog) < 50000 OR p_city_id IS NULL)
        OR co.iso = l_country_iso
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;