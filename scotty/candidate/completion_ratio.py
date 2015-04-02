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
    return 0


def completion_education(candidate):
    return 0


def completion_skills(candidate):
    return 0


def completion_languages(candidate):
    return 0


def completion_extended_profile(candidate):
    return 0


def completion_ratio(candidate):
    """
    >>> from scotty.candidate.models import Candidate, TargetPosition
    >>> from scotty.configuration.models import Skill
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

    :param candidate:
    :return:
    """

    completion = [
        {'percentage': .10, 'determinant': completion_base_profile},
        {'percentage': .10, 'determinant': completion_target_position},
        {'percentage': .05, 'determinant': completion_preferred_location},
        {'percentage': .15, 'determinant': completion_work_experience},
        {'percentage': .15, 'determinant': completion_education},
        {'percentage': .15, 'determinant': completion_skills},
        {'percentage': .15, 'determinant': completion_languages},
        {'percentage': .15, 'determinant': completion_extended_profile},
    ]

    ratio = 0
    for el in completion:
        ratio += el['percentage'] * el['determinant'](candidate)

    return ratio
