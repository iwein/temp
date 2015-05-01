from datetime import datetime
import logging
from operator import and_, or_
from uuid import uuid4

from scotty.configuration.models import Salutation
from scotty.employer.models import Employer, EmployerSavedSearch
from scotty.models.common import get_by_name_or_raise
from scotty.models.meta import DBSession

log = logging.getLogger(__name__)


def invite_employer(params):
    employer = Employer(
        company_name=params['company_name'],
        contact_first_name=params['contact_first_name'],
        contact_last_name=params['contact_last_name'],
        contact_salutation=get_by_name_or_raise(Salutation, params['contact_salutation']),
        email=params['email'],
        invite_token=uuid4(),
        invite_sent=datetime.now())
    DBSession.add(employer)
    DBSession.flush()
    return employer


def admin_check_saved_searches_for_candidate(candidate, emailer):
    """
    Upoon candidate approval: check saved searches.


    ASSUMPTIONS:
        Anonymous is not influenced by accepted offers, as a fresh candidate is assumed to not have offers.

    :param candidate:
    :param emailer:
    :return:
    """

    searches = DBSession.query(EmployerSavedSearch).all()

    sent_employers = set()

    for search in searches:
        is_match = False

        try:
            if search.advanced:
                matches = {}

                skills = search.terms.get('skills')
                if skills:
                    if not candidate.skills:
                        matches['skills'] = False
                    else:
                        cs = [s.name for s in candidate.skills]
                        matching_skills = filter(lambda x: x in cs, skills)
                        matches['skills'] = len(skills) == len(matching_skills)

                salary = search.terms.get('salary')
                if salary is not None:
                    matches['salary'] = candidate.target_position.minimum_salary <= salary \
                        if candidate.target_position else False

                role = search.terms.get('role')
                if role:
                    matches['role'] = candidate.target_position.role.name == role \
                        if candidate.target_position and candidate.target_position.role else False

                name = search.terms.get('name')
                if name:
                    name = name.lower()
                    matches['name'] = \
                        not candidate.anonymous and (
                            candidate.first_name.lower().startswith(name) or
                            candidate.last_name.lower().startswith(name)
                        )

                locations = search.terms.get('locations')
                if locations:
                    cl = [{'city': l.city.name, 'country_iso': l.city.country_iso} if l.city else
                          {'city': None, 'country_iso': l.country_iso}
                          for l in candidate.preferred_locations]
                    matches['location'] = len(filter(lambda x: x in cl, locations)) > 0

                is_match = reduce(and_, matches.values(), True)
            else:
                term = search.terms.get('q')
                if term:
                    terms = [t.lower() for t in term.split()]
                    matches = {}

                    if not candidate.anonymous:
                        matches['name'] = candidate.first_name.lower() in terms or candidate.last_name.lower() in terms

                    cs = [s.name.lower() for s in candidate.skills]
                    matches['skills'] = len(filter(lambda t: t in cs, terms)) > 0

                    countries, cities = zip(*[(l.city.country.name.lower(), l.city.name.lower())
                                              if l.city else (None, l.country.name)
                                              for l in candidate.preferred_locations])
                    matches['country'] = len(filter(lambda t: t in countries, terms)) > 0
                    matches['city'] = len(filter(lambda t: t in cities, terms)) > 0

                    is_match = reduce(or_, matches.values(), False)
        except Exception, e:
            # this is a loop, lets just get on with it, if stuff doesnt work so awesome
            log.error(u"SAVED_SEARCH_MATCHING_ERROR: sid:%s, sterms:%s, %s", search.id, search.terms, e)

        if is_match:
            employer = search.employer

            # do not send same candidate for different searches to same employer
            if employer.id not in sent_employers:
                sent_employers.add(employer.id)

                # exclude current employers
                current_employers = [wxp.company.name.lower()
                                     for wxp in candidate.work_experience
                                     if wxp.company and wxp.company.name and not wxp.end]
                if employer.company_name.lower() not in current_employers:
                    emailer.send_employer_new_candidate_search_match(employer.lang,
                                                                     employer.email,
                                                                     employer.contact_name,
                                                                     employer.company_name,
                                                                     candidate_name=candidate.full_name,
                                                                     candidate_id=candidate.id,
                                                                     search_name=search.name)





