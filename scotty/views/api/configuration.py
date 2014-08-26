from pyramid.httpexceptions import HTTPBadRequest
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Title, CompanyType, SkillLevel, Proficiency, EducationDegree, Language, Skill, JobTitle
from scotty.views import RootController


def listing_request(request, DbCls, search_term=None):
    offset = request.params.get('offset', 0)
    limit = request.params.get('limit', 100)

    basequery = DBSession.query(DbCls)
    if search_term:
        basequery = basequery.filter(DbCls.name.contains(search_term))

    query = basequery.offset(int(offset)).limit(int(limit))
    return {"pagination": {"total": basequery.count(), "offset": offset, "count": query.count()},
            "data": [t.name for t in query]}


class ConfigurationController(RootController):
    @view_config(route_name='configuration_list_titles', renderer='json')
    def titles(self):
        return listing_request(self.request, Title)

    @view_config(route_name='configuration_list_companytypes', renderer='json')
    def companytypes(self):
        return listing_request(self.request, CompanyType)

    @view_config(route_name='configuration_list_skilllevels', renderer='json')
    def skilllevels(self):
        return listing_request(self.request, SkillLevel)

    @view_config(route_name='configuration_list_proficiencies', renderer='json')
    def proficiencies(self):
        return listing_request(self.request, Proficiency)

    @view_config(route_name='configuration_list_educationdegrees', renderer='json')
    def educationdegrees(self):
        return listing_request(self.request, EducationDegree)

    @view_config(route_name='configuration_list_languages', renderer='json')
    def languages(self):
        return listing_request(self.request, Language, self.request.params.get("q"))

    @view_config(route_name='configuration_list_skills', renderer='json')
    def skills(self):
        return listing_request(self.request, Skill, self.request.params.get("q"))

    @view_config(route_name='configuration_list_job_titles', renderer='json')
    def job_titles(self):
        return listing_request(self.request, JobTitle, self.request.params.get("q"))

    @view_config(route_name='configuration_list_roles', renderer='json')
    def roles(self):
        return listing_request(self.request, JobTitle, self.request.params.get("q"))


def includeme(config):
    config.add_route('configuration_list_titles', 'titles')
    config.add_route('configuration_list_companytypes', 'company_types')
    config.add_route('configuration_list_skilllevels', 'skill_levels')
    config.add_route('configuration_list_proficiencies', 'proficiencies')
    config.add_route('configuration_list_educationdegrees', 'education_degrees')
    config.add_route('configuration_list_languages', 'languages')
    config.add_route('configuration_list_skills', 'skills')
    config.add_route('configuration_list_job_titles', 'job_titles')
    config.add_route('configuration_list_roles', 'roles')
