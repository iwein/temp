from datetime import datetime
from uuid import uuid4
from pyramid.view import view_config
from scotty.services.adminservice import invite_employer
from scotty.views import RootController
from scotty.views.common import POST


class AdminController(RootController):

    @view_config(route_name='admin_employer', **POST)
    def invite(self):
        employer = invite_employer(self.request.json)
        self.request.emailer.send_employer_invite(
            employer.email,
            employer.contact_name,
            employer.company_name,
            employer.invite_token
        )
        return employer


def includeme(config):
    config.add_route('admin_employer', 'employers')