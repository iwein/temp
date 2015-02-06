define(function() {
  'use strict';
  function gettext(value) {
    // HACK: this function add this tokens to i18n file
    return value;
  }

  return [
    gettext('January'),
    gettext('February'),
    gettext('March'),
    gettext('April'),
    gettext('May'),
    gettext('June'),
    gettext('July'),
    gettext('August'),
    gettext('September'),
    gettext('October'),
    gettext('November'),
    gettext('December'),
  ];
});
