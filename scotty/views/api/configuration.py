from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Title, CompanyType, SkillLevel, Proficiency, EducationDegree, Language, Skill, JobTitle, \
    Country, City, TrafficSource
from scotty.views import RootController
from sqlalchemy import or_, func
from sqlalchemy.orm import joinedload


def run_paginated_quer(request, basequery, serializer=list):
    offset = request.params.get('offset', 0)
    limit = request.params.get('limit', 100)
    query = basequery.offset(int(offset)).limit(int(limit))
    return {"pagination": {"total": basequery.count(), "offset": offset, "count": query.count()},
            "data": serializer(query)}


def listing_request(request, DbCls, search_term=None):
    basequery = DBSession.query(DbCls)
    if search_term:
        basequery = basequery.filter(DbCls.name.contains(search_term))
    return run_paginated_quer(request, basequery)


class ConfigurationController(RootController):
    @view_config(route_name='configuration_list_titles')
    def titles(self):
        return listing_request(self.request, Title)

    @view_config(route_name='configuration_list_companytypes')
    def companytypes(self):
        return listing_request(self.request, CompanyType)

    @view_config(route_name='configuration_list_skilllevels')
    def skilllevels(self):
        return listing_request(self.request, SkillLevel)

    @view_config(route_name='configuration_list_proficiencies')
    def proficiencies(self):
        return listing_request(self.request, Proficiency)

    @view_config(route_name='configuration_list_traffic_sources')
    def traffic_sources(self):
        return listing_request(self.request, TrafficSource)

    @view_config(route_name='configuration_list_educationdegrees')
    def educationdegrees(self):
        return listing_request(self.request, EducationDegree)

    @view_config(route_name='configuration_list_languages')
    def languages(self):
        return listing_request(self.request, Language, self.request.params.get("q"))

    @view_config(route_name='configuration_list_skills')
    def skills(self):
        return listing_request(self.request, Skill, self.request.params.get("q"))

    @view_config(route_name='configuration_list_job_titles')
    def job_titles(self):
        return listing_request(self.request, JobTitle, self.request.params.get("q"))

    @view_config(route_name='configuration_list_roles')
    def roles(self):
        return listing_request(self.request, JobTitle, self.request.params.get("q"))

    @view_config(route_name='configuration_list_countries')
    def countries(self):
        return listing_request(self.request, Country, self.request.params.get("q"))

    @view_config(route_name='configuration_list_locations')
    def locations(self):
        search_term = self.request.params.get("q")

        basequery = DBSession.query(City).options(joinedload('country'))
        if search_term:
            search_term = search_term.lower()
            basequery = basequery.filter(func.lower(City.name).contains(search_term))

        return run_paginated_quer(self.request, basequery)


def includeme(config):
    config.add_route('configuration_list_titles', 'titles')
    config.add_route('configuration_list_companytypes', 'company_types')
    config.add_route('configuration_list_skilllevels', 'skill_levels')
    config.add_route('configuration_list_proficiencies', 'proficiencies')
    config.add_route('configuration_list_traffic_sources', 'traffic_sources')
    config.add_route('configuration_list_educationdegrees', 'education_degrees')
    config.add_route('configuration_list_languages', 'languages')
    config.add_route('configuration_list_skills', 'skills')
    config.add_route('configuration_list_job_titles', 'job_titles')
    config.add_route('configuration_list_roles', 'roles')
    config.add_route('configuration_list_countries', 'countries')
    config.add_route('configuration_list_locations', 'locations')
