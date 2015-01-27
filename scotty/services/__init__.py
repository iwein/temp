import hashlib

__author__ = 'Martin'


def hash_pwd(pwd):
    if not pwd: return pwd
    return hashlib.sha256(pwd.encode('utf-8')).hexdigest()