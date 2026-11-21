// Account deletion for Google accounts (Google Play asks for a web page). The flow:
// Google's button gives an ID token → POST /v1/auth/google → a session kept only in this page's memory →
// «Delete account?» → DELETE /v1/account. A sign-in that just created the account (`created`) deletes it at
// once: there was nothing to delete. Nothing is stored in the browser.
(function () {
  'use strict';

  var API = 'https://nippon2go-api-820725286359.europe-southwest1.run.app';
  var CLIENT_ID = '820725286359-ieofn9apc3mncn1a0861n8ecin6k1nnh.apps.googleusercontent.com';
  var GOOGLE_LOCALES = { es: 'es', en: 'en', fr: 'fr', de: 'de', it: 'it', ko: 'ko', 'zh-Hant-TW': 'zh_TW' };

  var T = JSON.parse(document.getElementById('texts').textContent);
  var session = null;
  var busy = false;

  var el = {
    google: document.getElementById('google-button'),
    status: document.getElementById('status'),
    confirm: document.getElementById('confirm'),
    hello: document.getElementById('confirm-hello'),
    deleteButton: document.getElementById('delete-button'),
    cancelButton: document.getElementById('cancel-button'),
  };

  function say(text, tone) {
    el.status.textContent = text || '';
    el.status.hidden = !text;
    el.status.className = 'delete-status' + (tone ? ' ' + tone : '');
  }

  function showConfirm(visible) {
    el.confirm.hidden = !visible;
    el.google.hidden = visible;
  }

  function errorText(status) {
    if (status === 0) return T.errorNetwork;
    if (status === 429) return T.errorTooMany;
    if (status === 401) return T.errorGoogle;
    return T.errorLater;
  }

  function call(method, path, body) {
    var headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (session) headers.Authorization = 'Bearer ' + session;
    return fetch(API + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    }).then(function (response) {
      if (!response.ok) throw { status: response.status };
      return response.status === 204 ? null : response.json();
    }, function () {
      throw { status: 0 };
    });
  }

  function forget() {
    session = null;
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
  }

  function deleteAccount(afterSignIn) {
    busy = true;
    showConfirm(false);
    el.google.hidden = true;
    say(T.deleting);
    return call('DELETE', '/v1/account').then(function () {
      forget();
      busy = false;
      if (afterSignIn) {
        say(T.noAccount, 'done');
      } else {
        say(T.done, 'done');
      }
    }, function (error) {
      busy = false;
      if (afterSignIn) {
        // The account this sign-in made couldn't go: try again with a new sign-in.
        forget();
        el.google.hidden = false;
        say(errorText(error.status), 'error');
      } else if (error.status === 401) {
        // The session ended: sign in again.
        forget();
        el.google.hidden = false;
        say(T.signInAgain, 'error');
      } else {
        showConfirm(true);
        say(errorText(error.status), 'error');
      }
    });
  }

  function onCredential(response) {
    if (busy || !response || !response.credential) return;
    busy = true;
    session = null;
    showConfirm(false);
    say(T.checking);
    call('POST', '/v1/auth/google', { idToken: response.credential }).then(function (reply) {
      session = reply && reply.session;
      busy = false;
      if (!session) { say(T.errorLater, 'error'); return; }
      if (reply.created) { deleteAccount(true); return; }
      var name = reply.user && reply.user.firstName;
      el.hello.textContent = name ? T.helloName.replace('%@', name) : T.hello;
      say('');
      showConfirm(true);
      el.deleteButton.focus();
    }, function (error) {
      busy = false;
      say(errorText(error.status), 'error');
    });
  }

  el.deleteButton.addEventListener('click', function () {
    if (!busy && session) deleteAccount(false);
  });

  el.cancelButton.addEventListener('click', function () {
    if (busy) return;
    forget();
    showConfirm(false);
    say(T.cancelled);
  });

  function startGoogle() {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: onCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
    });
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    google.accounts.id.renderButton(el.google, {
      type: 'standard',
      theme: dark ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      locale: GOOGLE_LOCALES[document.documentElement.lang] || 'en',
    });
  }

  var script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = startGoogle;
  script.onerror = function () { say(T.googleUnavailable, 'error'); };
  document.head.appendChild(script);
})();
