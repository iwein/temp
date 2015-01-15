import os
from pyramid.exceptions import ConfigurationError


def split_strip(value, char=','):
    """
    Split a string by comma and strip whitespace.
    >>> split_strip('a')
    ['a']
    >>> split_strip('a , b')
    ['a', 'b']
    >>> split_strip('a , b  ,   c')
    ['a', 'b', 'c']
    """
    if value is None:
        return []
    return filter(None, [v.strip() for v in value.split(char)])


def ensure_list(l, path=None):
    """
    >>> ensure_list([1, 2])
    [1, 2]
    >>> ensure_list({'a': True})
    [{'a': True}]
    >>> ensure_list({'a': {'b': 1}}, ['a', 'b'])
    [1]
    >>> ensure_list({'b': 1}['b']) == ensure_list({'b': 1}, ['b'])
    True
    >>> ensure_list({'a': True}, ['a', 'b', 'c'])
    []
    """
    if path:
        try:
            for el in path:
                l = l[el]
        except (AttributeError, TypeError, KeyError):
            return []
    if isinstance(l, basestring):
        # yes, lastfm sometimes returns strings in
        # place of lists or dictionaries
        return []
    return l if isinstance(l, list) else [l]


def resolve_env_value(settings, key, default=None):
    value = settings[key]
    if value.startswith('__env__'):
        name, env_key = value.split(':', 1)
        actual_value = os.environ.get(env_key.strip())
        if actual_value is None:
            if default is None:
                raise ConfigurationError("Environment Variable %s not defined" % env_key)
            else:
                actual_value = default
        settings[key] = actual_value

