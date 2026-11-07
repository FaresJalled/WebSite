// Site settings
window.SITE_CONFIG = {
  // ---- Visitor counter ----------------------------------------------------------------
  // Default: the free Abacus counting service (abacus.jasoncameron.dev, no account needed).
  // Every browser is counted once; your own visits are not counted after you open
  // https://faresjalled.org/?owner=on once on each of your devices.
  counter: {
    service: 'abacus',            // 'abacus', or '' to switch the counter off
    namespace: 'faresjalled-org',
    key: 'visitors'
  },
  // Optional, instead of Abacus: your own Supabase database (private statistics and an e-mail
  // per new visitor; see the setup folder). When both values are filled in, Supabase is used.
  supabaseUrl: '',
  supabaseKey: '',

  // ---- Contact form ---------------------------------------------------------------------
  // Messages are delivered by FormSubmit.co. No e-mail address appears on the website:
  //  - formsubmitId: the random ID FormSubmit e-mails you after activation (best: the address
  //    is then nowhere in the code), or
  //  - formsubmitKey: the address, encoded (reversed + base64), used until the ID is set.
  formsubmitId: '',
  formsubmitKey: 'bW9jLmxpYW1nQHNyYWZkZWxsYWo=',

  // ---- Tipping --------------------------------------------------------------------------
  kofi: 'jasfar',
  paypalMe: '',
  teaPriceEUR: 3
};
