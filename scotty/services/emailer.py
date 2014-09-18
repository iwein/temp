import mandrill
import logging

log = logging.getLogger(__name__)

class MandrillEmailer(object):
    def __init__(self, settings):
        apikey = settings['mandrill.apikey']
        self.admin_emails = [r.strip() for r in settings['admin.emails'].split(',')]
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
        url = 'http://%s/candidate#/activate/%s' % (self.frontend, activation_token)
        return self.send('signup-welcome', [],
                         {'to': [{'email': email, 'name': first_name}],
                          'global_merge_vars': [
                              {'content': first_name, 'name': 'first_name'},
                              {'content': url, 'name': 'activation_link'}]})

    def send_employer_invite(self, email, contact_name, company_name, invite_token):
        url = 'http://%s/employer/#/signup/start/%s' % (self.frontend, invite_token)
        return self.send('employer-invite', [],
                         {'to': [{'email': email, 'name': contact_name}],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': url, 'name': 'invite_link'}]})

    def send_pending_approval(self, company_email, contact_name, company_name, employer_id):
        return self.send('admin-pending-employer', [],
                         {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': company_email, 'name': 'company_email'},
                              {'content': str(employer_id), 'name': 'employer_id'}]})

    def send_employer_was_bookmarked(self, company_email, contact_name, company_name, candidate_name, candidate_id):
        url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate_id)
        return self.send('employer-was-bookmarked-by-candidate', [],
                         {'to': [{'email': company_email, 'name': contact_name}],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': company_email, 'name': 'company_email'},
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': url, 'name': 'candidate_url'}]})

    def send_candidate_received_offer(self, email, candidate_name, company_name, offer_id):
        url = 'http://%s/candidate/#/offer/%s' % (self.frontend, offer_id)
        return self.send('candidate-received-offer', [],
                         {'to': [{'email': email, 'name': candidate_name}],
                          'global_merge_vars': [
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': url, 'name': 'offer_url'}]})


def emailer_factory(settings):
    return MandrillEmailer(settings)
