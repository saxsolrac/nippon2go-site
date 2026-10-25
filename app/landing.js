// Visits and store-button taps on the download pages (/app/ and /app/en/).
// - Always: an anonymous count on our own server, sent with navigator.sendBeacon. No cookies and
//   nothing saved on the device; the server logs only the page and the event.
// - Only after the visitor accepts: Google Analytics. It is never loaded before that choice.
(function () {
  var GA_ID = 'G-XLTQ4C88X7';
  var COUNTER = 'https://nippon2go-places-820725286359.europe-southwest1.run.app/v1/web/event';
  var CHOICE_KEY = 'n2g-analytics';
  // A yes or no is remembered for a year, then the banner asks again.
  var CHOICE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

  var script = document.currentScript;
  var page = script && script.getAttribute('data-page');
  var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  var TEXT = {
    es: {
      label: 'Cookies',
      text: 'Si aceptas, usamos Google Analytics (con cookies de Google) para saber cuánta gente visita esta página.',
      more: 'Más información',
      policy: '/es/privacidad/#analitica',
      reject: 'Rechazar',
      accept: 'Aceptar'
    },
    en: {
      label: 'Cookies',
      text: 'If you accept, we use Google Analytics (with Google cookies) to see how many people visit this page.',
      more: 'Learn more',
      policy: '/privacy/#analytics',
      reject: 'Reject',
      accept: 'Accept'
    }
  }[lang];

  function count(event) {
    if (!page || !navigator.sendBeacon) return;
    try {
      navigator.sendBeacon(COUNTER + '?page=' + page + '&event=' + event);
    } catch (e) {}
  }

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(CHOICE_KEY));
      if (saved && (saved.v === 'granted' || saved.v === 'denied') && Date.now() - saved.t < CHOICE_MAX_AGE) {
        return saved.v;
      }
    } catch (e) {}
    return null;
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(CHOICE_KEY, JSON.stringify({ v: value, t: Date.now() }));
    } catch (e) {}
  }

  var analyticsLoaded = false;
  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Analytics only: nothing for ads.
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(tag);
  }

  // Google Analytics keeps its cookies (_ga, _ga_<id>) on the main domain; removing them undoes a yes.
  function removeAnalyticsCookies() {
    var domain = location.hostname.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) return;
      document.cookie = name + '=; Max-Age=0; path=/';
      document.cookie = name + '=; Max-Age=0; path=/; domain=.' + domain;
    });
  }

  function choose(value) {
    saveChoice(value);
    if (value === 'granted') {
      loadAnalytics();
      return;
    }
    removeAnalyticsCookies();
    // Analytics already running on this page can only be stopped by loading the page again.
    if (analyticsLoaded) location.reload();
  }

  function showBanner() {
    if (document.getElementById('consent')) return;
    var box = document.createElement('div');
    box.id = 'consent';
    box.className = 'consent';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', TEXT.label);
    var text = document.createElement('p');
    text.textContent = TEXT.text + ' ';
    var more = document.createElement('a');
    more.href = TEXT.policy;
    more.textContent = TEXT.more;
    text.appendChild(more);
    var actions = document.createElement('div');
    actions.className = 'consent-actions';
    // Same look for both answers, so saying no is as easy as saying yes.
    [['denied', TEXT.reject], ['granted', TEXT.accept]].forEach(function (option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = option[1];
      button.addEventListener('click', function () {
        box.remove();
        choose(option[0]);
      });
      actions.appendChild(button);
    });
    box.appendChild(text);
    box.appendChild(actions);
    document.body.appendChild(box);
  }

  function start() {
    count('visit');
    var choice = readChoice();
    if (choice === 'granted') loadAnalytics();
    else if (choice === null) showBanner();

    // The footer link to change the answer only works with this script, so it starts hidden.
    var settings = document.querySelector('[data-consent-settings]');
    if (settings) {
      settings.hidden = false;
      settings.addEventListener('click', showBanner);
    }

    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[data-store]');
      if (!link) return;
      var store = link.getAttribute('data-store');
      count(store);
      if (analyticsLoaded) window.gtag('event', 'store_click', { store: store, transport_type: 'beacon' });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
