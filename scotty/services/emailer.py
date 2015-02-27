"""
Mandrill Emailer registry.

You HAVE to use the "register_template" decorator in your email sending function.

All Templates that should be ignored by this check IN MANDRILL have to be labelled "disabled".


"""

from functools import wraps
import mandrill
import logging
from pyramid.exceptions import ConfigurationError
from email.utils import parseaddr

log = logging.getLogger(__name__)

TEMPLATE_REGISTRY = set()


def register_template(template):
    TEMPLATE_REGISTRY.add(template)

    def register_template_inner(f):
        @wraps(f)
        def inner_function(self, *args, **kwargs):
            sender, message = f(self, *args, **kwargs)
            return sender(template, [], message)

        return inner_function

    return register_template_inner


def register_i18n_template(default, **templates):
    """
    :param default: default template, if no or no known language is selected
    :param kwargs: dictionary with language-iso code as key, template as value
    :return:
    """
    TEMPLATE_REGISTRY.add(default)
    for t in templates.values():
        TEMPLATE_REGISTRY.add(t)

    def register_template_inner(f):
        @wraps(f)
        def inner_function(self, lang, *args, **kwargs):
            template = templates.get(lang, default)
            sender, message = f(self, *args, **kwargs)
            return sender(template, [], message)

        return inner_function

    return register_template_inner


class MandrillEmailer(object):
    def __init__(self, settings):
        apikey = settings['mandrill.apikey']

        sender = settings.get('mandrill.sender')
        if sender:
            sender = parseaddr(sender)
        self.override_sender = sender

        self.admin_emails = [r.strip() for r in settings['admin.emails'].split(',')]
        log.info('Sending to ADMINS: %s', '/'.join(self.admin_emails))
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
            log.warning("UNUSED REQUIRED TEMPLATES in MANDRILL: %s " % ', '.join(
                [u['slug'] for u in error_unused]))

        for u in unused:
            labels = u['labels']
            log.warning("MANDRILL TEMPLATE NOT USED: %s (%s)", u['slug'], ', '.join(labels))

        return templates

    def __call__(self, request):
        return self

    def send(self, template, content, message):
        if self.override_sender:
            message.setdefault('from_name', self.override_sender[0])
            message.setdefault('from_email', self.override_sender[1])
        try:
            self.mandrill.messages.send_template(template, template_content=content, message=message, async=True)
        except mandrill.Error, e:
            log.error(e)
            return False
        else:
            return True

    # REFERER

    @register_i18n_template('candidate-invite', de='kandidaten-empfehlung')
    def send_friend_referral(self, sndr_email, sndr_name, rcvr_email, rcvr_name, message):
        return self.send_email_to_candidate({
            'from_email': sndr_email, 'from_name': sndr_name,
            'to': [{'email': rcvr_email, 'name': rcvr_name}] +
                  [{'email': email, 'name': 'Admin', 'type': 'bcc'}
                   for email in self.admin_emails],
            'global_merge_vars': [
                {'content': sndr_email, 'name': 'sndr_email'},
                {'content': sndr_name, 'name': 'sndr_name'},
                {'content': rcvr_email, 'name': 'rcvr_email'},
                {'content': rcvr_name, 'name': 'rcvr_name'},
                {'content': message, 'name': 'message'}]})

    # ========================== CANDIDATE ==========================
    def send_email_to_candidate(self, message):
        message.setdefault('global_merge_vars', []).append(
            {'content': self.candidate_dashboard_url, 'name': 'dashboard_url'})
        return self.send, message

    @register_i18n_template('candidate-confirm-email', de='candidate-confirm-email-de')
    def send_candidate_welcome(self, candidate):
        url = 'http://%s/candidate/#/activate/%s' % (self.frontend, candidate.activation_token)
        return self.send_email_to_candidate({'to': [{'email': candidate.email, 'name': candidate.first_name}],
                                             'global_merge_vars': [
                                                 {'content': candidate.first_name, 'name': 'first_name'},
                                                 {'content': url, 'name': 'activation_link'}]})

    @register_i18n_template('signup-welcome', de='signup-welcome-de')
    def send_candidate_approved(self, candidate):
        return self.send_email_to_candidate({'to': [{'email': candidate.email, 'name': candidate.first_name}],
                                             'global_merge_vars': [
                                                 {'content': candidate.first_name, 'name': 'first_name'}]})

    @register_i18n_template('candidate-pwd-reset', de='candidate-pwd-reset-de')
    def send_candidate_pwdforgot(self, email, first_name, reset_token):
        url = 'http://%s/candidate/#/reset-password/%s' % (self.frontend, reset_token)
        return self.send_email_to_candidate({'to': [{'email': email, 'name': first_name}],
                                             'global_merge_vars': [
                                                 {'content': first_name, 'name': 'first_name'},
                                                 {'content': url, 'name': 'url'}]})

    @register_i18n_template('candidate-received-offer', de='candidate-received-offer-de')
    def send_candidate_received_offer(self, email, personal_message, candidate_name, company_name, offer_id):
        url = 'http://%s/candidate/#/offer/%s' % (self.frontend, offer_id)
        return self.send_email_to_candidate({'to': [{'email': email, 'name': candidate_name}],
                                             'global_merge_vars': [
                                                 {'content': candidate_name, 'name': 'candidate_name'},
                                                 {'content': personal_message, 'name': 'personal_message'},
                                                 {'content': company_name, 'name': 'company_name'},
                                                 {'content': url, 'name': 'offer_url'}]})

    @register_i18n_template('candidate-hired-and-sleep', de='candidate-hired-and-sleep-de')
    def send_candidate_hired_email(self, offer, candidate, employer):
        url = 'http://%s/candidate/#/offer/%s' % (self.frontend, offer.id)
        return self.send_email_to_candidate({'to': [{'email': candidate.email, 'name': candidate.full_name}],
                                             'global_merge_vars': [
                                                 {'content': candidate.first_name, 'name': 'first_name'},
                                                 {'content': employer.company_name, 'name': 'company_name'},
                                                 {'content': url, 'name': 'url'}]})

    # ========================== EMPLOYER ==========================
    def send_email_to_employer(self, message):
        message.setdefault('global_merge_vars', []).append({'content': self.employer_dashboard_url,
                                                            'name': 'dashboard_url'})
        return self.send, message

    @register_i18n_template('employer-invite', de='employer-invite-de')
    def send_employer_invite(self, email, contact_name, company_name, invite_token):
        url = 'http://%s/employer/#/signup/start/%s' % (self.frontend, invite_token)
        return self.send_email_to_employer({'to': [{'email': email, 'name': contact_name}],
                                            'global_merge_vars': [
                                                {'content': contact_name, 'name': 'contact_name'},
                                                {'content': company_name, 'name': 'company_name'},
                                                {'content': url, 'name': 'invite_link'}]})

    @register_i18n_template('employer-confirm-email', de='employer-confirm-email-de')
    def send_employer_welcome(self, employer):
        return self.send_email_to_employer({'to': [{'email': employer.email, 'name': employer.contact_name}],
                                            'global_merge_vars': [
                                                {'content': employer.contact_name, 'name': 'contact_name'},
                                                {'content': employer.company_name, 'name': 'company_name'}]})

    @register_i18n_template('employer-welcome', de='employer-welcome-de')
    def send_employer_approved(self, employer):
        return self.send_email_to_employer({'to': [{'email': employer.email, 'name': employer.contact_name}],
                                            'global_merge_vars': [
                                                {'content': employer.contact_name, 'name': 'contact_name'},
                                                {'content': employer.company_name, 'name': 'company_name'}]})

    @register_i18n_template('employer-pwd-reset', de='employer-pwd-reset-de')
    def send_employer_pwdforgot(self, email, contact_name, company_name, reset_token):
        url = 'http://%s/employer/#/reset-password/%s' % (self.frontend, reset_token)
        return self.send_email_to_employer({'to': [{'email': email, 'name': contact_name}],
                                            'global_merge_vars': [
                                                {'content': contact_name, 'name': 'contact_name'},
                                                {'content': company_name, 'name': 'company_name'},
                                                {'content': url, 'name': 'url'}]})

    @register_i18n_template('employer-received-job-offer-request', de='employer-received-job-offer-request-de')
    def send_employer_offer_requested(self, company_email, contact_name, company_name, candidate_name,
                                      candidate_id):
        url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate_id)
        return self.send, {'to': [{'email': company_email, 'name': contact_name}],
                           'global_merge_vars': [
                               {'content': contact_name, 'name': 'contact_name'},
                               {'content': company_name, 'name': 'company_name'},
                               {'content': company_email, 'name': 'company_email'},
                               {'content': candidate_name, 'name': 'candidate_name'},
                               {'content': url, 'name': 'candidate_url'}]}

    @register_i18n_template('employer-new-candidate-suggested', de='employer-new-candidate-suggested-de')
    def send_employer_new_suggested_candidate(self, company_email, contact_name, company_name, candidate_name,
                                      candidate_id):
        url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate_id)
        return self.send, {'to': [{'email': company_email, 'name': contact_name}],
                           'global_merge_vars': [
                               {'content': contact_name, 'name': 'contact_name'},
                               {'content': company_name, 'name': 'company_name'},
                               {'content': company_email, 'name': 'company_email'},
                               {'content': candidate_name, 'name': 'candidate_name'},
                               {'content': url, 'name': 'candidate_url'}]}




    def send_employer_offer(self,
                            email,
                            candidate_name,
                            contact_name,
                            company_name,
                            offer_id,
                            candidate_id, **kwargs):
        offer_url = 'http://%s/employer/#/offer/%s' % (self.frontend, offer_id)
        candidate_url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate_id)

        gvars = [
            {'content': candidate_name, 'name': 'candidate_name'},
            {'content': contact_name, 'name': 'contact_name'},
            {'content': company_name, 'name': 'company_name'},
            {'content': offer_url, 'name': 'offer_url'},
            {'content': candidate_url, 'name': 'candidate_url'}]
        gvars.extend([{'content': v, 'name': k} for k,v in kwargs.items()])

        return self.send, {'to': [{'email': email, 'name': candidate_name}], 'global_merge_vars': gvars}

    @register_i18n_template('employer-offer-accepted', de='employer-offer-accepted-de')
    def send_employer_offer_accepted(self, email, candidate_name, contact_name,
                                     company_name, offer_id, candidate_id):
        return self.send_employer_offer(email, candidate_name, contact_name, company_name, offer_id,
                                        candidate_id)

    @register_i18n_template('employer-offer-rejected', de='employer-offer-rejected-de')
    def send_employer_offer_rejected(self, email, candidate_name, contact_name,
                                     company_name, offer_id, candidate_id, reason):
        return self.send_employer_offer(email, candidate_name, contact_name, company_name, offer_id,
                                        candidate_id, rejection_reason=reason)

    @register_i18n_template('employer-candidate-accepted-other-offer', de='employer-candidate-accepted-other-offer-de')
    def send_employers_offer_rejected(self, offer, candidate, employers, rejection_reason):
        offer_url = 'http://%s/employer/#/offer/%s' % (self.frontend, offer.id)
        candidate_url = 'http://%s/employer/#/candidate/%s' % (self.frontend, candidate.id)
        return self.send, {'to': [{'email': e.email, 'name': e.company_name, 'type': 'bcc'} for e in employers],
                           'merge_vars': [
                               {'rcpt': e.email, 'vars': [{'content': e.contact_name, 'name': 'contact_name'},
                                                          {'content': e.company_name,
                                                           'name': 'company_name'}]}
                               for e in employers],
                           'global_merge_vars': [
                               {'content': candidate.full_name, 'name': 'candidate_name'},
                               {'content': rejection_reason, 'name': 'rejection_reason'},
                               {'content': offer_url, 'name': 'offer_url'},
                               {'content': candidate_url, 'name': 'candidate_url'}]}

    # ========================== ADMIN ==========================
    @register_template('admin-pending-employer')
    def send_admin_pending_approval(self, company_email, contact_name, company_name, employer_id):
        return self.send, {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                           'global_merge_vars': [
                               {'content': contact_name, 'name': 'contact_name'},
                               {'content': company_name, 'name': 'company_name'},
                               {'content': company_email, 'name': 'company_email'},
                               {'content': str(employer_id), 'name': 'employer_id'}]}

    @register_template('admin-candidate-hired')
    def send_admin_candidate_hired_email(self, candidate_name, contact_name, company_name, offer_id):
        url = 'http://%s/admin/#/offer/%s' % (self.frontend, offer_id)
        return self.send, {'to': [{'email': email, 'name': 'Admin'} for email in self.admin_emails],
                           'global_merge_vars': [
                               {'content': contact_name, 'name': 'contact_name'},
                               {'content': company_name, 'name': 'company_name'},
                               {'content': candidate_name, 'name': 'candidate_name'},
                               {'content': url, 'name': 'url'}]}

    @register_template('admin-contact-request')
    def send_contact_request(self, email, name, message):
        return self.send, {
            'from_email': email, 'from_name': name,
            'to': [{'email': admin_email, 'name': 'Admin'} for admin_email in self.admin_emails],
            'global_merge_vars': [
                {'content': name, 'name': 'name'},
                {'content': email, 'name': 'email'},
                {'content': message, 'name': 'message'}]}


def emailer_factory(settings):
    return MandrillEmailer(settings)
