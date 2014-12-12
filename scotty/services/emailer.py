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

    def send_candidate_welcome(self, candidate):
        url = 'http://%s/candidate#/activate/%s' % (self.frontend, candidate.activation_token)
        return self.send('candidate-confirm-email', [],
                         {'to': [{'email': candidate.email, 'name': candidate.first_name}],
                          'global_merge_vars': [
                              {'content': candidate.first_name, 'name': 'first_name'},
                              {'content': url, 'name': 'activation_link'}]})

    def send_candidate_approved(self, candidate):
        return self.send('signup-welcome', [],
                         {'to': [{'email': candidate.email, 'name': candidate.first_name}],
                          'global_merge_vars': [{'content': candidate.first_name, 'name': 'first_name'}]})


    def send_candidate_pwdforgot(self, email, first_name, reset_token):
        url = 'http://%s/candidate#/reset-password/%s' % (self.frontend, reset_token)
        return self.send('candidate-pwd-reset', [],
                         {'to': [{'email': email, 'name': first_name}],
                          'global_merge_vars': [
                              {'content': first_name, 'name': 'first_name'},
                              {'content': url, 'name': 'url'}]})

    def send_employer_pwdforgot(self, email, contact_name, company_name, reset_token):
        url = 'http://%s/employer#/reset-password/%s' % (self.frontend, reset_token)
        return self.send('employer-pwd-reset', [],
                         {'to': [{'email': email, 'name': contact_name}],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': url, 'name': 'url'}]})

    def send_employer_invite(self, email, contact_name, company_name, invite_token):
        url = 'http://%s/employer/#/signup/start/%s' % (self.frontend, invite_token)
        return self.send('employer-invite', [],
                         {'to': [{'email': email, 'name': contact_name}],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': url, 'name': 'invite_link'}]})

    def send_employer_welcome(self, employer):
        return self.send('employer-confirm-email', [],
                         {'to': [{'email': employer.email, 'name': employer.contact_name}],
                          'global_merge_vars': [
                              {'content': employer.contact_name, 'name': 'contact_name'},
                              {'content': employer.company_name, 'name': 'company_name'}]})

    def send_employer_approved(self, employer):
        return self.send('employer-welcome', [],
                         {'to': [{'email': employer.email, 'name': employer.contact_name}],
                          'global_merge_vars': [
                              {'content': employer.contact_name, 'name': 'contact_name'},
                              {'content': employer.company_name, 'name': 'company_name'}]})

    def send_pending_approval(self, company_email, contact_name, company_name, employer_id):
        return self.send('admin-pending-employer', [],
                         {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': company_email, 'name': 'company_email'},
                              {'content': str(employer_id), 'name': 'employer_id'}]})

    def send_admin_candidate_hired_email(self, candidate_name, contact_name, company_name, offer_id):
        url = 'http://%s/admin/#/offer/%s' % (self.frontend, offer_id)
        return self.send('admin-candidate-hired', [],
                         {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': url, 'name': 'url'}]})

    def send_candidate_hired_email(self, offer, candidate, employer):
        url = 'http://%s/candidate/#/offer/%s' % (self.frontend, offer.id)
        return self.send('candidate-hired-and-sleep', [],
                         {'to': [{'email': candidate.email, 'name': candidate.full_name}],
                          'global_merge_vars': [
                              {'content': candidate.first_name, 'name': 'first_name'},
                              {'content': employer.company_name, 'name': 'company_name'},
                              # TODO: HARD CODED
                              {'content': 1001, 'name': 'bonus'},
                              {'content': 1001, 'name': 'referreal_bonus'},
                              {'content': url, 'name': 'url'}]})

    def send_employer_joboffer_requested(self, company_email, contact_name, company_name, candidate_name, candidate_id):
        url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate_id)
        return self.send('employer-was-bookmarked-by-candidate', [],
                         {'to': [{'email': company_email, 'name': contact_name}],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': company_email, 'name': 'company_email'},
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': url, 'name': 'candidate_url'}]})

    def send_candidate_received_offer(self, email, personal_message, candidate_name, company_name, offer_id):
        url = 'http://%s/candidate/#/offer/%s' % (self.frontend, offer_id)
        return self.send('candidate-received-offer', [],
                         {'to': [{'email': email, 'name': candidate_name}],
                          'global_merge_vars': [
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': personal_message, 'name': 'personal_message'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': url, 'name': 'offer_url'}]})

    def send_employer_offer_accepted(self, email, candidate_name, contact_name,
                                     company_name, offer_id, candidate_id):
        return self.send_employer_offer(email, candidate_name, contact_name, company_name, offer_id, candidate_id,
                                        'employer-offer-accepted')

    def send_employer_offer_rejected(self, email, candidate_name, contact_name,
                                     company_name, offer_id, candidate_id):
        return self.send_employer_offer(email, candidate_name, contact_name, company_name, offer_id, candidate_id,
                                        'employer-offer-rejected')

    def send_employers_offer_rejected(self, offer, candidate, employers, rejection_reason):
        offer_url = 'http://%s/employer/#/offer/%s' % (self.frontend, offer.id)
        candidate_url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate.id)
        return self.send('employer-offer-rejected', [],
                         {'to': [{'email': e.email, 'name': e.company_name, 'type': 'bcc'} for e in employers],
                          'merge_vars': [{'rcpt': e.email, 'vars': [{'content': e.contact_name, 'name': 'contact_name'},
                                                                    {'content': e.company_name, 'name': 'company_name'}]}
                                         for e in employers],
                          'global_merge_vars': [
                              {'content': candidate.full_name, 'name': 'candidate_name'},
                              {'content': rejection_reason, 'name': 'rejection_reason'},
                              {'content': offer_url, 'name': 'offer_url'},
                              {'content': candidate_url, 'name': 'candidate_url'}]})

    def send_employer_offer(self, email,
                            candidate_name,
                            contact_name,
                            company_name,
                            offer_id,
                            candidate_id, template):
        offer_url = 'http://%s/employer/#/offer/%s' % (self.frontend, offer_id)
        candidate_url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate_id)
        return self.send(template, [],
                         {'to': [{'email': email, 'name': candidate_name}],
                          'global_merge_vars': [
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': offer_url, 'name': 'offer_url'},
                              {'content': candidate_url, 'name': 'candidate_url'}]})


def emailer_factory(settings):
    return MandrillEmailer(settings)
