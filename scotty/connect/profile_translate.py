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


def extract_location(value):
    if not value:
        return {}
    result = {}
    iso = value.get('country', {}).get('code', '').upper()
    if iso:
        result['contact_country_iso'] = iso
    city = value.get('name', '').split(',')
    if len(city) > 1:
        city = city[0]
    result['contact_city'] = city
    return result


def extract_date(value, name='dob'):
    if not value or not value.get('year'):
        return {}
    return {name: date(value['year'], value.get('month') or 1, value.get('day') or 1)}


def rename(to_name):
    def ren(value):
        return {to_name: value}

    return ren


def extract_im(translates):
    def extract(values):
        if not values:
            return {}
        result = {}
        for im in values.get('values', []):
            if im.get('imAccountType') in translates:
                result[translates[im['imAccountType']]] = im['imAccountName']
        return result

    return extract


PROFILE_TRANSLATION = {'firstName': rename('first_name'), 'lastName': rename('last_name'), 'pictureUrl': rename('picture_url'),
                       'emailAddress': rename('email'), 'mainAddress': extract_address, 'dateOfBirth': extract_date,
                       'imAccounts': extract_im({'skype': 'contact_skype'}), 'location': extract_location}


def translate(profile, mapping=PROFILE_TRANSLATION):
    translated = {}
    for k, v in profile.items():
        if mapping.get(k):
            translated.update(mapping[k](v))
    return translated