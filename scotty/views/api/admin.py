from datetime import datetime

from pyramid.httpexceptions import HTTPNotFound, HTTPConflict
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Employer
from scotty.services.adminservice import invite_employer
from scotty.views import RootController
from scotty.views.common import POST, run_paginated_query, GET
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError


class AdminController(RootController):

    @view_config(route_name='admin_employer', **POST)
    def invite(self):
        try:
            employer = invite_employer(self.request.json)
        except IntegrityError:
            raise HTTPConflict("company_name of email already registered.")

        self.request.emailer.send_employer_invite(
            employer.email,
            employer.contact_name,
            employer.company_name,
            employer.invite_token
        )
        return employer

    @view_config(route_name='admin_employer_by_status', **GET)
    def admin_employer_by_status(self):
        status = self.request.matchdict['status']
        query = DBSession.query(Employer).filter(*Employer.by_status(status))

        searchterm = self.request.params.get('q')
        if searchterm is not None:
            query = query.filter(func.lower(Employer.company_name).contains(func.lower(searchterm)))

        return run_paginated_query(self.request, query)

    @view_config(route_name='admin_employer_approve', **GET)
    def admin_employer_approve(self):
        employer_id = self.request.matchdict['employer_id']
        employer = DBSession.query(Employer).get(employer_id)
        if not employer:
            raise HTTPNotFound("Unknown Employer ID")
        employer.approved = datetime.now()
        return employer


def includeme(config):
    config.add_route('admin_employer', 'employers')
    config.add_route('admin_employer_by_status', 'employers/{status}')
    config.add_route('admin_employer_approve', 'employers/{employer_id}/approve')