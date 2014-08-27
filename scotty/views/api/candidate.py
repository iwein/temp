from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from scotty import DBSession
from scotty.models import Candidate
from scotty.services.candidateservice import candidate_from_signup
from scotty.views import RootController

POST = dict(request_method="POST", content_type='application/json', renderer="json")
DELETE = dict(request_method="DELETE", renderer="json")

class CandidateController(RootController):

    @view_config(route_name='candidates', **POST)
    def create(self):
        candidate = candidate_from_signup(self.request.json)
        DBSession.add(candidate)
        DBSession.flush()

        return candidate

    @view_config(route_name='candidate', **DELETE)
    def delete(self):
        id = self.request.matchdict["id"]
        candidate = DBSession.query(Candidate).get(id)
        if not candidate:
            raise HTTPNotFound("Unknown Candidate ID")
        DBSession.delete(candidate)
        return {"status": "success"}


def includeme(config):
    config.add_route('candidates', '')
    config.add_route('candidate', '{id}')
