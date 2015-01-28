from pyramid.security import NO_PERMISSION_REQUIRED
from sqlalchemy import func

from pyramid.view import view_config
from scotty.models.meta import DBSession
from scotty.configuration.models import Salutation, CompanyType, SkillLevel, Proficiency, Language, Skill, JobTitle, \
    Country, City, TrafficSource, Institution, Company, Seniority, Degree, Course, Benefit, RejectionReason, \
    TravelWillingness, WithdrawalReason, Role
from scotty.views import RootController
from scotty.views.common import listing_request, run_paginated_query, list_featured
from sqlalchemy.orm import joinedload


def includeme(config):
    config.add_route('configuration_list_seniority', 'seniority')
    config.add_route('configuration_list_salutations', 'salutations')
    config.add_route('configuration_list_companytypes', 'company_types')
    config.add_route('configuration_list_skilllevels', 'skill_levels')
    config.add_route('configuration_list_proficiencies', 'proficiencies')
    config.add_route('configuration_list_travel_willingness', 'travelwillingness')
    config.add_route('configuration_list_traffic_sources', 'traffic_sources')
    config.add_route('configuration_list_rejectionreasons', 'rejectionreasons')
    config.add_route('configuration_list_withdrawalreasons', 'withdrawalreasons')
    config.add_route('configuration_list_degrees', 'degrees')
    config.add_route('configuration_list_courses', 'courses')
    config.add_route('configuration_list_benefits', 'benefits')
    config.add_route('configuration_list_languages', 'languages')
    config.add_route('configuration_list_featured_languages', 'languages/featured')
    config.add_route('configuration_list_skills', 'skills')
    config.add_route('configuration_list_featured_skills', 'skills/featured')
    config.add_route('configuration_list_job_titles', 'job_titles')
    config.add_route('configuration_list_roles', 'roles')
    config.add_route('configuration_list_featured_roles', 'roles/featured')
    config.add_route('configuration_list_institutions', 'institutions')
    config.add_route('configuration_list_companies', 'companies')
    config.add_route('configuration_list_countries', 'countries')
    config.add_route('configuration_list_locations', 'locations')
    config.add_route('configuration_list_featured_locations', 'locations/featured')


class ConfigurationController(RootController):
    @view_config(route_name='configuration_list_seniority', permission=NO_PERMISSION_REQUIRED)
    def seniority(self):
        return listing_request(self.request, Seniority, order_field=Seniority.id)

    @view_config(route_name='configuration_list_salutations', permission=NO_PERMISSION_REQUIRED)
    def salutation(self):
        return listing_request(self.request, Salutation, order_field=Salutation.id)

    @view_config(route_name='configuration_list_companytypes', permission=NO_PERMISSION_REQUIRED)
    def companytypes(self):
        return listing_request(self.request, CompanyType, order_field=CompanyType.id)

    @view_config(route_name='configuration_list_skilllevels', permission=NO_PERMISSION_REQUIRED)
    def skilllevels(self):
        return listing_request(self.request, SkillLevel, order_field=SkillLevel.id)

    @view_config(route_name='configuration_list_proficiencies', permission=NO_PERMISSION_REQUIRED)
    def proficiencies(self):
        return listing_request(self.request, Proficiency, order_field=Proficiency.id)

    @view_config(route_name='configuration_list_travel_willingness', permission=NO_PERMISSION_REQUIRED)
    def travel_willingness(self):
        return listing_request(self.request, TravelWillingness, order_field=TravelWillingness.id)

    @view_config(route_name='configuration_list_traffic_sources', permission=NO_PERMISSION_REQUIRED)
    def traffic_sources(self):
        return listing_request(self.request, TrafficSource, order_field=TrafficSource.id)

    @view_config(route_name='configuration_list_rejectionreasons', permission=NO_PERMISSION_REQUIRED)
    def rejectionreasons(self):
        return listing_request(self.request, RejectionReason, self.request.params.get("q"), ignorecase=True,
                               order_field=RejectionReason.id)

    @view_config(route_name='configuration_list_withdrawalreasons', permission=NO_PERMISSION_REQUIRED)
    def withdrawalreasons(self):
        return listing_request(self.request, WithdrawalReason, self.request.params.get("q"), ignorecase=True,
                               order_field=WithdrawalReason.id)

    @view_config(route_name='configuration_list_benefits', permission=NO_PERMISSION_REQUIRED)
    def benefits(self):
        return listing_request(self.request, Benefit, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_degrees', permission=NO_PERMISSION_REQUIRED)
    def degrees(self):
        return listing_request(self.request, Degree, self.request.params.get("q"), ignorecase=True, order_field=func
                               .length(Degree.name))

    @view_config(route_name='configuration_list_courses', permission=NO_PERMISSION_REQUIRED)
    def courses(self):
        return listing_request(self.request, Course, self.request.params.get("q"), ignorecase=True, order_field=func
                               .length(Course.name))

    @view_config(route_name='configuration_list_languages', permission=NO_PERMISSION_REQUIRED)
    def languages(self):
        return listing_request(self.request, Language, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_featured_languages', permission=NO_PERMISSION_REQUIRED)
    def featured_languages(self):
        return list_featured(self.request, Language)

    @view_config(route_name='configuration_list_skills', permission=NO_PERMISSION_REQUIRED)
    def skills(self):
        return listing_request(self.request, Skill, self.request.params.get("q"), ignorecase=True, order_field=func
                               .length(Skill.name))

    @view_config(route_name='configuration_list_featured_skills', permission=NO_PERMISSION_REQUIRED)
    def featured_skills(self):
        return list_featured(self.request, Skill)

    @view_config(route_name='configuration_list_job_titles', permission=NO_PERMISSION_REQUIRED)
    def job_titles(self):
        return listing_request(self.request, JobTitle, self.request.params.get("q"), ignorecase=True, order_field
        =func.length(JobTitle.name))

    @view_config(route_name='configuration_list_roles', permission=NO_PERMISSION_REQUIRED)
    def roles(self):
        return listing_request(self.request, Role, self.request.params.get("q"), ignorecase=True, order_field=func.length(Role.name))

    @view_config(route_name='configuration_list_featured_roles', permission=NO_PERMISSION_REQUIRED)
    def featured_roles(self):
        return list_featured(self.request, Role)

    @view_config(route_name='configuration_list_institutions', permission=NO_PERMISSION_REQUIRED)
    def institutions(self):
        return listing_request(self.request, Institution, self.request.params.get("q"), ignorecase=True, order_field=func.length(Institution.name))

    @view_config(route_name='configuration_list_companies', permission=NO_PERMISSION_REQUIRED)
    def companies(self):
        return listing_request(self.request, Company, self.request.params.get("q"), ignorecase=True, order_field=func.length(Company.name))

    @view_config(route_name='configuration_list_countries', permission=NO_PERMISSION_REQUIRED)
    def countries(self):
        searchterm = self.request.params.get("q")
        return listing_request(self.request, Country, searchterm, ignorecase=True)

    @view_config(route_name='configuration_list_locations', permission=NO_PERMISSION_REQUIRED)
    def locations(self):
        basequery = DBSession.query(City).options(joinedload('country'))

        city_name = self.request.params.get("q")
        country_iso = None
        if city_name and ',' in city_name:
            city_name, country_iso = [x.strip() for x in city_name.split(',', 1)]
            country_iso = country_iso.upper()

        if city_name:
            filter = func.lower(City.name).contains(func.lower(city_name))
            basequery = basequery.filter(filter).order_by(func.length(City.name))

        country_iso = self.request.params.get("country_iso", country_iso)
        if country_iso:
            basequery = basequery.filter(City.country_iso == country_iso)

        return run_paginated_query(self.request, basequery)

    @view_config(route_name='configuration_list_featured_locations', permission=NO_PERMISSION_REQUIRED)
    def featured_locations(self):
        return list_featured(self.request, City)
