def completion_base_profile(candidate):
    return 1 if candidate and candidate.email else 0
from decimal import Decimal, ROUND_DOWN


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
    edu_list = candidate.education
    if not edu_list:
        return 0
    ratio = 0  # when there is something

    institute = True
    subject = True
    dates = True
    degree = True
    for edu in edu_list:
        institute = institute and bool(edu.institution_id)
        subject = subject and bool(edu.course_id)
        dates = dates and bool(edu.start and edu.end)
        degree = degree and bool(edu.degree_id)

    if institute:
        ratio += .4
    if subject:
        ratio += .2
    if dates:
        ratio += .2
    if degree:
        ratio += .2
    return ratio


def completion_skills(candidate):
    skills = candidate.skills
    ratio = .5 if len(skills) >= 3 else len(skills) / 10
    if len([s for s in skills if s.level_id]) >= 3:
        ratio += .5
    return 0


def completion_languages(candidate):
    langs = candidate.languages
    ratio = 0
    if [l for l in langs if lang.name == 'German']:
        ratio += 5
    if [l for l in langs if lang.name == 'German']:
        ratio += 5
    return ratio


def completion_extended_profile(candidate):
    ratio = 0
    if candidate.dob:
        ratio += .3
    if candidate.location_id:
        ratio += .2
    if candidate.picture_url:
        ratio += .2
    if candidate.contact_phone:
        ratio += .1
    if candidate.github_url:
        ratio += .05
    if candidate.stackoverflow_url:
        ratio += .05
    if candidate.blog_url:
        ratio += .05
    if candidate.contact_skype:
        ratio += .05
    return ratio


COMPLETION_CALCULATOR = [
    {'percentage': .10, 'determinant': completion_base_profile},
    {'percentage': .10, 'determinant': completion_target_position},
    {'percentage': .05, 'determinant': completion_preferred_location},
    {'percentage': .2, 'determinant': completion_work_experience},
    {'percentage': .1, 'determinant': completion_education},
    {'percentage': .1, 'determinant': completion_skills},
    {'percentage': .1, 'determinant': completion_languages},
    {'percentage': .25, 'determinant': completion_extended_profile}
]


assert sum([x['percentage'] for x in COMPLETION_CALCULATOR]) == 1


def completion_ratio(candidate):
    """
    >>> from scotty.candidate.models import Candidate, TargetPosition, WorkExperience, Education
    >>> from scotty.configuration.models import Skill
    >>> from datetime import datetime
    >>> c = Candidate(email = 'm@m.com')
    >>> completion_ratio(c)
    0.1

    >>> basec = completion_ratio(c)
    >>> c.target_position = TargetPosition(skills = [Skill(name='skill1')])
    >>> completion_ratio(c) - basec
    0.033

    >>> c.target_position.minimum_salary = 200
    >>> completion_ratio(c) - basec
    0.066

    >>> c.target_position.role_id = 20
    >>> completion_ratio(c) - basec
    0.1

    >>> basec = completion_ratio(c)
    >>> c.work_experience = [WorkExperience(company_id=1)]
    >>> completion_ratio(c) - basec
    0.08000000000000002

    >>> c.work_experience[0].role_id = 1
    >>> c.work_experience[0].summary = 'summary'
    >>> c.work_experience[0].start = datetime.now()
    >>> completion_ratio(c) - basec
    0.2

    >>> basec = completion_ratio(c)
    >>> c.education = [Education(institution_id=1)]
    >>> completion_ratio(c) - basec
    0.040000000000000036

    >>> c.education[0].course_id = 2
    >>> c.education[0].start = datetime.now()
    >>> c.education[0].end = datetime.now()
    >>> c.education[0].degree_id = 20
    >>> completion_ratio(c) - basec
    0.09999999999999998

    >>> c.skills = []
    >>> basec = completion_ratio(c)

    :param candidate:
    :return:
    """

    ratio = 0
    for el in COMPLETION_CALCULATOR:
        ratio += el['percentage'] * el['determinant'](candidate)

    return ratio
