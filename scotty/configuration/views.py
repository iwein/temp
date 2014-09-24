from pyramid.view import view_config
from scotty import DBSession
from scotty.configuration.models import Salutation, CompanyType, SkillLevel, Proficiency, Language, Skill, JobTitle, \
    Country, City, TrafficSource, Institution, Company, Seniority, Degree, Course, Benefit, RejectionReason, \
    TravelWillingness
from scotty.views import RootController
from scotty.views.common import listing_request, run_paginated_query
from sqlalchemy import func
from sqlalchemy.orm import joinedload



class ConfigurationController(RootController):
    @view_config(route_name='configuration_list_seniority')
    def seniority(self):
        return listing_request(self.request, Seniority, order_field=Seniority.id)

    @view_config(route_name='configuration_list_salutations')
    def salutation(self):
        return listing_request(self.request, Salutation, order_field=Salutation.id)

    @view_config(route_name='configuration_list_companytypes')
    def companytypes(self):
        return listing_request(self.request, CompanyType, order_field=CompanyType.id)

    @view_config(route_name='configuration_list_skilllevels')
    def skilllevels(self):
        return listing_request(self.request, SkillLevel, order_field=SkillLevel.id)

    @view_config(route_name='configuration_list_proficiencies')
    def proficiencies(self):
        return listing_request(self.request, Proficiency, order_field=Proficiency.id)

    @view_config(route_name='configuration_list_travel_willingness')
    def travel_willingness(self):
        return listing_request(self.request, TravelWillingness, order_field=TravelWillingness.id)

    @view_config(route_name='configuration_list_traffic_sources')
    def traffic_sources(self):
        return listing_request(self.request, TrafficSource, order_field=TrafficSource.id)

    @view_config(route_name='configuration_list_degrees')
    def degrees(self):
        return listing_request(self.request, Degree)

    @view_config(route_name='configuration_list_rejectionreasons')
    def rejectionreasons(self):
        return listing_request(self.request, RejectionReason, self.request.params.get("q"), ignorecase=True,
                               order_field=RejectionReason.id)

    @view_config(route_name='configuration_list_benefits')
    def benefits(self):
        return listing_request(self.request, Benefit, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_courses')
    def courses(self):
        return listing_request(self.request, Course, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_languages')
    def languages(self):
        return listing_request(self.request, Language, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_skills')
    def skills(self):
        return listing_request(self.request, Skill, self.request.params.get("q"), ignorecase=True, order_field=func.length(Skill.name))

    @view_config(route_name='configuration_list_job_titles')
    def job_titles(self):
        return listing_request(self.request, JobTitle, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_roles')
    def roles(self):
        return listing_request(self.request, JobTitle, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_institutions')
    def institutions(self):
        return listing_request(self.request, Institution, self.request.params.get("q"), ignorecase=True)

    @view_config(route_name='configuration_list_companies')
    def companies(self):
        return listing_request(self.request, Company, self.request.params.get("q"), ignorecase=True)

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
            basequery = basequery.filter(filter).order_by(func.length(City.name))

        ciso = self.request.params.get("country_iso")
        if ciso:
            basequery = basequery.filter(City.country_iso == ciso)
        return run_paginated_query(self.request, basequery)

