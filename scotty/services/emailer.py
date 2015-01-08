"""
Mandrill Emailer registry.

You HAVE to use the "register_template" decorator in your email sending function.

All Templates that should be ignored by this check IN MANDRILL have to be labelled "disabled".


"""

from functools import wraps
import mandrill
import logging
from pyramid.exceptions import ConfigurationError

log = logging.getLogger(__name__)

TEMPLATE_REGISTRY = set()


def register_template(template):

    TEMPLATE_REGISTRY.add(template)

    def register_template_inner(f):
        @wraps(f)
        def inner_function(self, *args, **kwargs):
            return f(self, template, *args, **kwargs)
        return inner_function
    return register_template_inner


class MandrillEmailer(object):
    def __init__(self, settings):
        apikey = settings['mandrill.apikey']
        self.admin_emails = [r.strip() for r in settings['admin.emails'].split(',')]
        self.frontend = settings['frontend.domain']
        self.mandrill = mandrill.Mandrill(apikey)
        self.employer_dashboard_url = 'http://%s/employer' % self.frontend
        self.candidate_dashboard_url = 'http://%s/candidate' % self.frontend

        self.on_startup_check()

    def on_startup_check(self):
        templates = self.mandrill.templates.list()

        unused = templates[:]
        undefined = TEMPLATE_REGISTRY.copy()

        for template in templates:
            if template['slug'] in TEMPLATE_REGISTRY:
                undefined.discard(template['slug'])
                del unused[unused.index(template)]

        if len(undefined):
            raise ConfigurationError("UNDEFINED MANDRILL TEMPLATES: %s " %
                                     ', '.join(undefined))

        error_unused = [u for u in unused if 'disabled' not in u['labels']]
        if len(error_unused):
            raise ConfigurationError("UNUSED REQUIRED TEMPLATES in MANDRILL: %s " % ', '.join(
                [u['slug'] for u in error_unused]))

        for u in unused:
            labels = u['labels']
            log.warning("MANDRILL TEMPLATE NOT USED: %s (%s)", u['slug'], ', '.join(labels))

        return templates

    def __call__(self, request):
        return self

    def send(self, template, content, message):
        try:
            self.mandrill.messages.send_template(template, template_content=content, message=message, async=True)
        except mandrill.Error, e:
            log.error(e)
            return False
        else:
            return True


    # REFERER

    @register_template('candidate-invite')
    def send_friend_referral(self, template, sndr_email, sndr_name, rcvr_email, rcvr_name):
        return self.send_email_to_candidate(template, [],
                                            {'to': [{'email': rcvr_email, 'name': rcvr_name}] +
                                                   [{'email': email, 'name': 'Admin', 'type': 'bcc'}
                                                    for email in self.admin_emails],
                                             'global_merge_vars': [
                                                 {'content': sndr_email, 'name': 'sndr_email'},
                                                 {'content': sndr_name, 'name': 'sndr_name'},
                                                 {'content': rcvr_email, 'name': 'rcvr_email'},
                                                 {'content': rcvr_name, 'name': 'rcvr_name'}]})

    # ========================== CANDIDATE ==========================
    def send_email_to_candidate(self, template, content, message):
        message.setdefault('global_merge_vars', []).append(
            {'content': self.candidate_dashboard_url, 'name': 'dashboard_url'})
        return self.send(template, content, message)

    @register_template('candidate-confirm-email')
    def send_candidate_welcome(self, template, candidate):
        url = 'http://%s/candidate#/activate/%s' % (self.frontend, candidate.activation_token)
        return self.send_email_to_candidate(template, [],
                                            {'to': [{'email': candidate.email, 'name': candidate.first_name}],
                                             'global_merge_vars': [
                                                 {'content': candidate.first_name, 'name': 'first_name'},
                                                 {'content': url, 'name': 'activation_link'}]})

    @register_template('signup-welcome')
    def send_candidate_approved(self, template, candidate):
        return self.send_email_to_candidate(template, [],
                                            {'to': [{'email': candidate.email, 'name': candidate.first_name}],
                                             'global_merge_vars': [{'content': candidate.first_name, 'name': 'first_name'}]})

    @register_template('candidate-pwd-reset')
    def send_candidate_pwdforgot(self, template, email, first_name, reset_token):
        url = 'http://%s/candidate#/reset-password/%s' % (self.frontend, reset_token)
        return self.send_email_to_candidate(template, [],
                                            {'to': [{'email': email, 'name': first_name}],
                                             'global_merge_vars': [
                                                 {'content': first_name, 'name': 'first_name'},
                                                 {'content': url, 'name': 'url'}]})

    @register_template('candidate-received-offer')
    def send_candidate_received_offer(self, template, email, personal_message, candidate_name, company_name, offer_id):
        url = 'http://%s/candidate/#/offer/%s' % (self.frontend, offer_id)
        return self.send_email_to_candidate(template, [],
                         {'to': [{'email': email, 'name': candidate_name}],
                          'global_merge_vars': [
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': personal_message, 'name': 'personal_message'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': url, 'name': 'offer_url'}]})

    @register_template('candidate-hired-and-sleep')
    def send_candidate_hired_email(self, template, offer, candidate, employer):
        url = 'http://%s/candidate/#/offer/%s' % (self.frontend, offer.id)
        return self.send_email_to_candidate(template, [],
                                            {'to': [{'email': candidate.email, 'name': candidate.full_name}],
                                             'global_merge_vars': [
                                                 {'content': candidate.first_name, 'name': 'first_name'},
                                                 {'content': employer.company_name, 'name': 'company_name'},
                                                 {'content': url, 'name': 'url'}]})

    # ========================== EMPLOYER ==========================
    def send_email_to_employer(self, template, content, message):
        message.setdefault('global_merge_vars', []).append(
            {'content': self.employer_dashboard_url, 'name': 'dashboard_url'})
        return self.send(template, content, message)

    @register_template('employer-invite')
    def send_employer_invite(self, template, email, contact_name, company_name, invite_token):
        url = 'http://%s/employer/#/signup/start/%s' % (self.frontend, invite_token)
        return self.send_email_to_employer(template, [],
                                           {'to': [{'email': email, 'name': contact_name}],
                                            'global_merge_vars': [
                                                {'content': contact_name, 'name': 'contact_name'},
                                                {'content': company_name, 'name': 'company_name'},
                                                {'content': url, 'name': 'invite_link'}]})

    @register_template('employer-confirm-email')
    def send_employer_welcome(self, template, employer):
        return self.send_email_to_employer(template, [],
                                           {'to': [{'email': employer.email, 'name': employer.contact_name}],
                                            'global_merge_vars': [
                                                {'content': employer.contact_name, 'name': 'contact_name'},
                                                {'content': employer.company_name, 'name': 'company_name'}]})

    @register_template('employer-welcome')
    def send_employer_approved(self, template, employer):
        return self.send_email_to_employer(template, [],
                                           {'to': [{'email': employer.email, 'name': employer.contact_name}],
                                            'global_merge_vars': [
                                                {'content': employer.contact_name, 'name': 'contact_name'},
                                                {'content': employer.company_name, 'name': 'company_name'}]})

    @register_template('employer-pwd-reset')
    def send_employer_pwdforgot(self, template, email, contact_name, company_name, reset_token):
        url = 'http://%s/employer#/reset-password/%s' % (self.frontend, reset_token)
        return self.send_email_to_employer(template, [],
                                           {'to': [{'email': email, 'name': contact_name}],
                                            'global_merge_vars': [
                                                {'content': contact_name, 'name': 'contact_name'},
                                                {'content': company_name, 'name': 'company_name'},
                                                {'content': url, 'name': 'url'}]})

    @register_template('employer-received-job-offer-request')
    def send_employer_offer_requested(self, template, company_email, contact_name, company_name, candidate_name, candidate_id):
        url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate_id)
        return self.send(template, [],
                         {'to': [{'email': company_email, 'name': contact_name}],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': company_email, 'name': 'company_email'},
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': url, 'name': 'candidate_url'}]})

    def send_employer_offer(self, template,
                            email,
                            candidate_name,
                            contact_name,
                            company_name,
                            offer_id,
                            candidate_id):
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

    @register_template('employer-offer-accepted')
    def send_employer_offer_accepted(self, template, email, candidate_name, contact_name,
                                     company_name, offer_id, candidate_id):
        return self.send_employer_offer(template, email, candidate_name, contact_name, company_name, offer_id, candidate_id)

    @register_template('employer-offer-rejected')
    def send_employer_offer_rejected(self, template, email, candidate_name, contact_name,
                                     company_name, offer_id, candidate_id):
        return self.send_employer_offer(template, email, candidate_name, contact_name, company_name, offer_id, candidate_id)

    @register_template('employer-candidate-accepted-other-offer')
    def send_employers_offer_rejected(self, template, offer, candidate, employers, rejection_reason):
        offer_url = 'http://%s/employer/#/offer/%s' % (self.frontend, offer.id)
        candidate_url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate.id)
        return self.send(template, [],
                         {'to': [{'email': e.email, 'name': e.company_name, 'type': 'bcc'} for e in employers],
                          'merge_vars': [{'rcpt': e.email, 'vars': [{'content': e.contact_name, 'name': 'contact_name'},
                                                                    {'content': e.company_name,
                                                                     'name': 'company_name'}]}
                                         for e in employers],
                          'global_merge_vars': [
                              {'content': candidate.full_name, 'name': 'candidate_name'},
                              {'content': rejection_reason, 'name': 'rejection_reason'},
                              {'content': offer_url, 'name': 'offer_url'},
                              {'content': candidate_url, 'name': 'candidate_url'}]})

    # ========================== ADMIN ==========================
    @register_template('admin-pending-employer')
    def send_admin_pending_approval(self, template, company_email, contact_name, company_name, employer_id):
        return self.send(template, [],
                         {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': company_email, 'name': 'company_email'},
                              {'content': str(employer_id), 'name': 'employer_id'}]})

    @register_template('admin-candidate-hired')
    def send_admin_candidate_hired_email(self, template, candidate_name, contact_name, company_name, offer_id):
        url = 'http://%s/admin/#/offer/%s' % (self.frontend, offer_id)
        return self.send(template, [],
                         {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                          'global_merge_vars': [
                              {'content': contact_name, 'name': 'contact_name'},
                              {'content': company_name, 'name': 'company_name'},
                              {'content': candidate_name, 'name': 'candidate_name'},
                              {'content': url, 'name': 'url'}]})

    @register_template('admin-contact-request')
    def send_contact_request(self, template, email, name, message):
        return self.send(template, [],
                         {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                          'global_merge_vars': [
                              {'content': name, 'name': 'name'},
                              {'content': email, 'name': 'email'},
                              {'content': message, 'name': 'message'}]})

def emailer_factory(settings):
    return MandrillEmailer(settings)
