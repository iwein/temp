import mandrill
import logging

log = logging.getLogger(__name__)

class MandrillEmailer(object):
    def __init__(self, settings):
        apikey = settings['mandrill.apikey']
        self.frontend = settings['frontend.domain']
        self.mandrill = mandrill.Mandrill(apikey)

    def __call__(self, request):
        return self

    def send(self, template, content, message):
        try:
            self.mandrill.messages.send_template(template, template_content=content, message=message)
        except mandrill.Error, e:
            log.error(e)
            return False
        else:
            return True

    def send_welcome(self, email, first_name, activation_token):
        url = 'http://%s/candidate.html#/activate/%s' % (self.frontend, activation_token)
        return self.send('signup-welcome', [], {'to': [{'email': email, 'name': first_name}],
                                                'global_merge_vars': [
                                                    {'content': first_name, 'name': 'first_name'},
                                                    {'content': url, 'name': 'activation_link'}]})

    def send_employer_invite(self, email, contact_name, company_name, invite_token):
        url = 'http://%s/employer/#/signup/start/%s' % (self.frontend, invite_token)
        return self.send('employer-invite', [], {'to': [{'email': email, 'name': contact_name}],
                                                 'global_merge_vars': [
                                                     {'content': contact_name, 'name': 'contact_name'},
                                                     {'content': company_name, 'name': 'company_name'},
                                                     {'content': url, 'name': 'invite_link'}]})


def emailer_factory(settings):
    return MandrillEmailer(settings)