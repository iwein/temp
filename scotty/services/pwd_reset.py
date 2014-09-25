from datetime import datetime, timedelta
from uuid import uuid4
from pyramid.httpexceptions import HTTPNotFound, HTTPConflict, HTTPServerError
from scotty import DBSession


def requestpassword(cls, email, resend, emailer):
    obj = DBSession.query(cls).filter(cls.email == email).first()
    if not obj:
        raise HTTPNotFound('Unknown Email')

    benchtime = datetime.now() - timedelta(1)
    if not obj.pwdforgot_sent or resend or obj.pwdforgot_sent <= benchtime:
        obj.pwdforgot_token = uuid4()
        obj.pwdforgot_send = datetime.now()
        emailer(obj)
        return {'success': True, 'token': obj.pwdforgot_token}
    elif obj.pwdforgot_sent > benchtime:
        raise HTTPConflict("Token was send within last 24 hours")
    else:
        raise HTTPServerError("Shouldnt get here")


def validatepassword(cls, token):
    obj = DBSession.query(cls).filter(cls.pwdforgot_token == token).first()
    if not obj:
        raise HTTPNotFound('Unknown Email')
    else:
        return {'success': True}


def resetpassword(cls, token, pwd):
    obj = DBSession.query(cls).filter(cls.pwdforgot_token == token).first()
    if not obj:
        raise HTTPNotFound('Unknown Email')
    else:
        obj.pwdforgot_sent = None
        obj.pwdforgot_token = None
        obj.password = pwd
        return {'success': True}