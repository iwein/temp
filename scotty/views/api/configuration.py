from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Title, CompanyType, SkillLevel, Proficiency, Language, Skill, JobTitle, \
    Country, City, TrafficSource, Institution, Company, Seniority, Degree
from scotty.views import RootController
from scotty.views.common import listing_request, run_paginated_query
from sqlalchemy import func
from sqlalchemy.orm import joinedload



class ConfigurationController(RootController):
    @view_config(route_name='configuration_list_seniority')
    def seniority(self):
        return listing_request(self.request, Seniority)

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

    @view_config(route_name='configuration_list_degrees')
    def degrees(self):
        return listing_request(self.request, Degree)

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

    @view_config(route_name='configuration_list_institutions')
    def institutions(self):
        return listing_request(self.request, Institution, self.request.params.get("q"))

    @view_config(route_name='configuration_list_companies')
    def companies(self):
        return listing_request(self.request, Company, self.request.params.get("q"))

    @view_config(route_name='configuration_list_countries')
    def countries(self):
        searchterm = self.request.params.get("q")
        return listing_request(self.request, Country, searchterm, ignorecase=True)

    @view_config(route_name='configuration_list_locations')
    def locations(self):
        basequery = DBSession.query(City).options(joinedload('country'))

        searchterm = self.request.params.get("q")
        if searchterm:
            filter = func.lower(City.name).contains(func.lower(searchterm))
            basequery = basequery.filter(filter)

        return run_paginated_query(self.request, basequery)


def includeme(config):
    config.add_route('configuration_list_seniority', 'seniority')
    config.add_route('configuration_list_titles', 'titles')
    config.add_route('configuration_list_companytypes', 'company_types')
    config.add_route('configuration_list_skilllevels', 'skill_levels')
    config.add_route('configuration_list_proficiencies', 'proficiencies')
    config.add_route('configuration_list_traffic_sources', 'traffic_sources')
    config.add_route('configuration_list_degrees', 'degrees')
    config.add_route('configuration_list_languages', 'languages')
    config.add_route('configuration_list_skills', 'skills')
    config.add_route('configuration_list_job_titles', 'job_titles')
    config.add_route('configuration_list_roles', 'roles')
    config.add_route('configuration_list_institutions', 'institutions')
    config.add_route('configuration_list_companies', 'companies')
    config.add_route('configuration_list_countries', 'countries')
    config.add_route('configuration_list_locations', 'locations')
