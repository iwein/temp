from pyramid.httpexceptions import HTTPNotFound
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from scotty.candidate.services import candidate_from_login
from scotty.employer.services import employer_from_login
from scotty.views.common import POST


@view_config(route_name='login', permission=NO_PERMISSION_REQUIRED, **POST)
def login(context, request):
    candidate = candidate_from_login(request.json)
    employer = employer_from_login(request.json)
    if not (candidate or employer):
        raise HTTPNotFound("Unknown User Email or Password.")

    # always prefer candidate over company
    result = {'preferred': 'candidate' if candidate else 'employer'}
    if employer:
        request.session['employer_id'] = employer.id
        result['employer'] = employer

    if candidate:
        request.session['candidate_id'] = candidate.id
        result['candidate'] = candidate
    return result
