import mandrill


class MandrillEmailer(object):
    def __init__(self, settings):
        apikey = settings['mandrill.apikey']
        self.frontend = settings['frontend.domain']
        self.mandrill = mandrill.Mandrill(apikey)

    def __call__(self, request):
        return self

    def send_welcome(self, email, first_name, activation_token):
        """
        send-template(string key,
                        string template_name,
                        array template_content,
                        struct message,
                        boolean async,
                        string ip_pool,
                        string send_at)

        send(string key, struct message, boolean async, string ip_pool, string send_at)
        """
        url = 'http://%s/#/activate/%s' % (self.frontend, activation_token)
        try:
            self.mandrill.messages.send_template('signup-welcome',
                                                 template_content=[],
                                                 message={'to': [{'email': email, 'name': first_name}],
                                                          'global_merge_vars': [
                                                              {'content': first_name, 'name': 'first_name'},
                                                              {'content': url, 'name': 'activation_link'}]})
        except mandrill.Error, e:
            return False
        else:
            return True


def emailer_factory(settings):
    return MandrillEmailer(settings)