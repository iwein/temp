from datetime import date
import re


zip_match = re.compile('([0-9]{5})')


def extract_address(value):
    if not value:
        return {}

    result = {}
    lines = value.split('\n')
    if len(lines) > 1 and zip_match.match(lines[1]):
        result['contact_zipcode'] = zip_match.match(lines[1]).group(1)
    result['contact_line1'] = lines[0]
    return result


def extract_date(value, name='dob'):
    if not value or not value.get('year'):
        return {}
    return {name: date(value['year'], value.get('month') or 1, value.get('day') or 1)}


def rename(to_name):
    def ren(value):
        return {to_name: value}
    return ren


def translate(profile, mapping):
    translated = {}
    for k, v in profile.items():
        if mapping.get(k):
            translated.update(mapping[k](v))
    return translated