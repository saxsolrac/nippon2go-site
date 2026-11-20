// The pages under /abrir/ (made by a script, one per app link). With Nippon2Go installed, iOS and Android open the
// app before this page loads (/.well-known/apple-app-site-association and assetlinks.json). Here the app isn't
// installed, or the link was opened inside another app's browser: like /go/, each phone goes to its store as soon as
// the page has loaded, tagged with the link (App Store campaign and Google Play referrer "abrir-rutas-kioto"), and the
// page keeps the buttons for Back and for computers. English when the browser isn't in Spanish. No cookies, nothing
// counted.
var N2GLink = (function () {
  // "/abrir/rutas/kioto/" → "abrir-rutas-kioto", within the App Store's 30-character campaign limit.
  function campaign(path) {
    var parts = String(path).toLowerCase().split('/').filter(Boolean);
    return parts.join('-').replace(/[^a-z0-9-]/g, '').slice(0, 30) || 'abrir';
  }
  function links(path) {
    var ct = campaign(path);
    return {
      appStore: 'https://apps.apple.com/app/apple-store/id6818258413?pt=129547332&ct=' + ct + '&mt=8',
      play: 'https://play.google.com/store/apps/details?id=com.nippon2go.app&referrer=' +
        encodeURIComponent('utm_source=nippon2go&utm_medium=app_link&utm_campaign=' + ct)
    };
  }
  // iPadOS reports itself as a Mac, so a touch screen on "MacIntel" counts as iOS too.
  function platform(ua, navPlatform, touchPoints) {
    if (/iPhone|iPad|iPod/.test(ua) || (navPlatform === 'MacIntel' && touchPoints > 1)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'other';
  }
  return { campaign: campaign, links: links, platform: platform };
})();

(function () {
  // Also loaded by the site's 404.html, where only addresses under /abrir/ go to the store.
  if (!/^\/abrir(\/|$)/i.test(location.pathname)) return;
  var l = N2GLink.links(location.pathname);
  var p = N2GLink.platform(navigator.userAgent || '', navigator.platform || '', navigator.maxTouchPoints || 0);
  var url = p === 'ios' ? l.appStore : p === 'android' ? l.play : null;
  // Back from a store page that loaded inside an in-app browser: show the buttons instead of going there again.
  var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  var back = nav && nav.type === 'back_forward';
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('[data-store="app_store"]').href = l.appStore;
    document.querySelector('[data-store="google_play"]').href = l.play;
    if (!/^es\b/i.test(navigator.language || '')) {
      document.documentElement.lang = 'en';
      document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en'); });
      document.querySelectorAll('[data-en-href]').forEach(function (el) { el.href = el.getAttribute('data-en-href'); });
      document.querySelectorAll('[data-en-alt]').forEach(function (el) { el.alt = el.getAttribute('data-en-alt'); });
      var h1 = document.querySelector('h1');
      if (h1) document.title = h1.textContent;
    }
  });
  if (!url || back) return;
  // Go once the page has loaded, so this page stays in history and Back returns to its buttons.
  window.addEventListener('load', function () {
    setTimeout(function () { location.href = url; }, 0);
  });
})();
