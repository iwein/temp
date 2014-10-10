
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
