def completion_base_profile(candidate):
    return 1 if candidate and candidate.email else 0


def completion_target_position(candidate):
    tp = candidate.target_position
    if not tp:
        return 0
    ratio = 0
    if len(tp.skills) > 0:
        ratio += .33
    if tp.minimum_salary:
        ratio += .33
    if tp.role_id:
        ratio += .34
    return ratio


def completion_preferred_location(candidate):
    return 1 if len(candidate.preferred_locations) else 0


def completion_work_experience(candidate):
    wxp_list = candidate.work_experience
    if not wxp_list:
        return 0
    ratio = 0  # when there is something

    #everything has role and company

    company = True
    title = True
    summary = True
    startend = True
    for wxp in wxp_list:
        company = company and bool(wxp.company_id)
        title = title and bool(wxp.role_id)
        summary = summary and bool(wxp.summary)
        startend = startend and bool(wxp.start)

    if company:
        ratio += .4
    if title:
        ratio += .2
    if summary:
        ratio += .2
    if startend:
        ratio += .2
    return ratio

def completion_education(candidate):
    return 0


def completion_skills(candidate):
    return 0


def completion_languages(candidate):
    return 0


def completion_extended_profile(candidate):
    return 0


COMPLETION_CALCULATOR = [
    {'percentage': .10, 'determinant': completion_base_profile},
    {'percentage': .10, 'determinant': completion_target_position},
    {'percentage': .05, 'determinant': completion_preferred_location},
    {'percentage': .15, 'determinant': completion_work_experience},
    {'percentage': .15, 'determinant': completion_education},
    {'percentage': .15, 'determinant': completion_skills},
    {'percentage': .15, 'determinant': completion_languages},
    {'percentage': .15, 'determinant': completion_extended_profile}
]

assert sum([x['percentage'] for x in COMPLETION_CALCULATOR]) == 1


def completion_ratio(candidate):
    """
    >>> from scotty.candidate.models import Candidate, TargetPosition, WorkExperience
    >>> from scotty.configuration.models import Skill
    >>> from datetime import datetime
    >>> c = Candidate(email = 'm@m.com')
    >>> completion_ratio(c)
    0.1

    >>> c.target_position = TargetPosition(skills = [Skill(name='skill1')])
    >>> completion_ratio(c)
    0.133

    >>> c.target_position.minimum_salary = 200
    >>> completion_ratio(c)
    0.166

    >>> c.target_position.role_id = 20
    >>> completion_ratio(c)
    0.2

    >>> c.work_experience = [WorkExperience(company_id=1)]
    >>> completion_ratio(c)
    0.26

    >>> c.work_experience[0].role_id = 1
    >>> c.work_experience[0].summary = 'summary'
    >>> c.work_experience[0].start = datetime.now()
    >>> completion_ratio(c)
    0.35

    :param candidate:
    :return:
    """

    ratio = 0
    for el in COMPLETION_CALCULATOR:
        ratio += el['percentage'] * el['determinant'](candidate)

    return ratio
