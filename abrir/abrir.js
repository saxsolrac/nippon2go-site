// The pages under /abrir/ (made by a script, one per app link). With Nippon2Go installed, iOS and Android open the
// app before this page loads (/.well-known/apple-app-site-association and assetlinks.json). Here the app isn't
// installed, or the link was opened inside another app's browser: like /go/, each phone goes to its store as soon as
// the page has loaded, tagged with the link (App Store campaign and Google Play referrer "abrir-rutas-kioto"), and the
// page keeps the buttons for Back and for computers. In the app's 7 languages, from the browser's. No cookies, nothing
// counted.
// Inside Instagram, TikTok or Facebook the link loads in that app's own browser, which never hands it to the app (tested
// on an iPhone with an Instagram story, 25/11/2026): there the page doesn't go to the store. On iOS it says to use
// ··· › «Abrir en el navegador externo», which opens Nippon2Go on the link's screen (tested the same day; a link to
// x-safari-https:// did nothing in Instagram). On Android a button opens the app with an intent.
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
  // Browsers inside other apps (Instagram, Facebook, Messenger, Threads, TikTok, LinkedIn, Snapchat, Pinterest, LINE):
  // they load links themselves, so the phone never offers them to Nippon2Go as Safari, Chrome or WhatsApp do.
  function inApp(ua) {
    return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Barcelona|musical_ly|BytedanceWebview|TikTok|LinkedInApp|Snapchat|Pinterest|\bLine\//i.test(ua);
  }
  // On Android, the way out of such a browser: an intent for Nippon2Go with the same link, or Google Play when it
  // isn't installed.
  function intent(path, hash, play) {
    return 'intent://nippon2go.com' + path + hash + '#Intent;scheme=https;package=com.nippon2go.app;S.browser_fallback_url=' +
      encodeURIComponent(play) + ';end';
  }
  return { campaign: campaign, links: links, platform: platform, inApp: inApp, intent: intent };
})();

// The texts in the app's 7 languages: Spanish in the HTML, English in data-en, the other five here, keyed by the
// English text. Titles with a city are built from the city's name in each language. The language is the browser's,
// English when it isn't one of the seven.
var N2GText = (function () {
  var LANGS = ['es', 'en', 'fr', 'de', 'it', 'ko', 'zh'];
  var HOME = { es: '/es/', en: '/', fr: '/fr/', de: '/de/', it: '/it/', ko: '/ko/', zh: '/zh-hant/' };
  var PRIVACY = { es: '/es/privacidad/', en: '/privacy/', fr: '/fr/confidentialite/', de: '/de/datenschutz/',
    it: '/it/privacy/', ko: '/ko/privacy/', zh: '/zh-hant/privacy/' };
  var CITIES = { Tokyo: { de: 'Tokio', ko: '도쿄', zh: '東京' }, Kyoto: { ko: '교토', zh: '京都' }, Osaka: { ko: '오사카', zh: '大阪' },
    Nara: { ko: '나라', zh: '奈良' }, Kamakura: { ko: '가마쿠라', zh: '鎌倉' }, Yokohama: { ko: '요코하마', zh: '橫濱' },
    Hiroshima: { ko: '히로시마', zh: '廣島' } };
  var PATTERNS = [
    [/^Your (\w+) route$/, { fr: 'Ton itinéraire à {c}', de: 'Deine Route in {c}', it: 'Il tuo itinerario a {c}', ko: '{c} 여행 경로', zh: '你的{c}路線' }],
    [/^What to see in (\w+)$/, { fr: 'Que voir à {c}', de: 'Sehenswertes in {c}', it: 'Cosa vedere a {c}', ko: '{c}에서 볼 곳', zh: '{c}必看景點' }]
  ];
  var TEXT = {
    'This opens in the Nippon2Go app. Don’t have it yet? Get it free:': {
      fr: 'Ça s’ouvre dans l’app Nippon2Go. Tu ne l’as pas encore\u00a0? Télécharge-la gratuitement\u00a0:',
      de: 'Das öffnet sich in der Nippon2Go-App. Du hast sie noch nicht? Lade sie kostenlos:',
      it: 'Si apre nell’app Nippon2Go. Non ce l’hai ancora? Scaricala gratis:',
      ko: 'Nippon2Go 앱에서 열립니다. 아직 앱이 없나요? 무료로 받으세요:',
      zh: '這會在 Nippon2Go App 中開啟。還沒有 App 嗎？免費下載：' },
    'Already have the app? In Instagram or TikTok, tap ··· at the top right and choose “Open in browser”.': {
      fr: 'Tu as déjà l’app\u00a0? Dans Instagram ou TikTok, touche ··· en haut à droite et choisis «\u00a0Ouvrir dans le navigateur\u00a0».',
      de: 'Du hast die App schon? Tippe in Instagram oder TikTok oben rechts auf ··· und wähle „Im Browser öffnen“.',
      it: 'Hai già l’app? In Instagram o TikTok tocca ··· in alto a destra e scegli «Apri nel browser».',
      ko: '이미 앱이 있나요? Instagram이나 TikTok에서 오른쪽 위의 ···을 누르고 ‘브라우저에서 열기’를 선택하세요.',
      zh: '已經有 App 了嗎？在 Instagram 或 TikTok 中點右上角的 ···，然後選擇「在瀏覽器中開啟」。' },
    'Already have Nippon2Go?': {
      es: '¿Ya tienes Nippon2Go?', fr: 'Tu as déjà Nippon2Go ?', de: 'Du hast Nippon2Go schon?', it: 'Hai già Nippon2Go?',
      ko: '이미 Nippon2Go가 있나요?', zh: '已經有 Nippon2Go 了嗎？' },
    'Open in the app': {
      es: 'Abrir en la app', fr: 'Ouvrir dans l’app', de: 'In der App öffnen', it: 'Apri nell’app', ko: '앱에서 열기', zh: '在 App 中開啟' },
    'Tap ··· at the top right and choose “Open in external browser”. Nippon2Go will open on this screen.': {
      es: 'Toca ··· arriba a la derecha y elige «Abrir en el navegador externo». Nippon2Go se abrirá en esta pantalla.',
      fr: 'Touche ··· en haut à droite et choisis « Ouvrir dans un navigateur externe ». Nippon2Go s’ouvrira sur cet écran.',
      de: 'Tippe oben rechts auf ··· und wähle „In externem Browser öffnen“. Nippon2Go öffnet sich auf diesem Bildschirm.',
      it: 'Tocca ··· in alto a destra e scegli «Apri nel browser esterno». Nippon2Go si aprirà su questa schermata.',
      ko: '오른쪽 위의 ···을 누르고 ‘외부 브라우저에서 열기’를 선택하세요. Nippon2Go가 이 화면으로 열립니다.',
      zh: '點右上角的 ···，選擇「在外部瀏覽器中開啟」。Nippon2Go 會直接開啟這個畫面。' },
    'Tap ··· at the top right and choose to open in the browser. Nippon2Go will open on this screen.': {
      es: 'Toca ··· arriba a la derecha y elige abrir en el navegador. Nippon2Go se abrirá en esta pantalla.',
      fr: 'Touche ··· en haut à droite et choisis d’ouvrir dans le navigateur. Nippon2Go s’ouvrira sur cet écran.',
      de: 'Tippe oben rechts auf ··· und wähle, im Browser zu öffnen. Nippon2Go öffnet sich auf diesem Bildschirm.',
      it: 'Tocca ··· in alto a destra e scegli di aprire nel browser. Nippon2Go si aprirà su questa schermata.',
      ko: '오른쪽 위의 ···을 누르고 브라우저에서 열기를 선택하세요. Nippon2Go가 이 화면으로 열립니다.',
      zh: '點右上角的 ···，選擇在瀏覽器中開啟。Nippon2Go 會直接開啟這個畫面。' },
    'Download free on the': { fr:'Télécharge-la gratuitement sur l’', de: 'Kostenlos laden im', it: 'Scaricala gratis su', ko: '무료로 다운로드', zh: '免費下載於' },
    'Get it on': { fr: 'Disponible sur', de: 'Jetzt bei', it: 'Disponibile su', ko: '다운로드', zh: '立即下載' },
    'Privacy': { fr: 'Confidentialité', de: 'Datenschutz', it: 'Privacy', ko: '개인정보 보호', zh: '隱私' },
    'Nippon2Go app icon': { fr: 'Icône de l’app Nippon2Go', de: 'Nippon2Go-App-Symbol', it: 'Icona dell’app Nippon2Go', ko: 'Nippon2Go 앱 아이콘', zh: 'Nippon2Go App 圖示' },
    'Your flights': { fr: 'Tes vols', de: 'Deine Flüge', it: 'I tuoi voli', ko: '내 항공편', zh: '你的航班' },
    'Your Japan checklist': { fr: 'Ta liste pour le Japon', de: 'Deine Japan-Packliste', it: 'La tua lista per il Giappone', ko: '일본 여행 준비물 목록', zh: '你的日本行李清單' },
    'When are you going to Japan?': { fr: 'Quand pars-tu au Japon\u00a0?', de: 'Wann reist du nach Japan?', it: 'Quando vai in Giappone?', ko: '언제 일본에 가나요?', zh: '你什麼時候去日本？' },
    'Questions and answers': { fr: 'Questions et réponses', de: 'Fragen und Antworten', it: 'Domande e risposte', ko: '자주 묻는 질문', zh: '常見問題' },
    'My routes': { fr: 'Mes itinéraires', de: 'Meine Routen', it: 'I miei itinerari', ko: '나의 경로', zh: '我的路線' },
    'Explore Japan': { fr: 'Explore le Japon', de: 'Entdecke Japan', it: 'Esplora il Giappone', ko: '일본 둘러보기', zh: '探索日本' }
  };
  // The 404 page for any other address.
  var MISSING = {
    en: ['This page doesn’t exist', 'Go to nippon2go.com'], fr: ['Cette page n’existe pas', 'Aller sur nippon2go.com'],
    de: ['Diese Seite gibt es nicht', 'Zu nippon2go.com'], it: ['Questa pagina non esiste', 'Vai su nippon2go.com'],
    ko: ['존재하지 않는 페이지입니다', 'nippon2go.com으로 이동'], zh: ['這個頁面不存在', '前往 nippon2go.com']
  };

  function language() {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).toLowerCase().split('-')[0];
      if (LANGS.indexOf(code) >= 0) return code;
    }
    return 'en';
  }

  function translate(en, lang) {
    if (lang === 'en') return en;
    if (TEXT[en] && TEXT[en][lang]) return TEXT[en][lang];
    for (var i = 0; i < PATTERNS.length; i++) {
      var match = en.match(PATTERNS[i][0]);
      if (match) {
        var city = (CITIES[match[1]] && CITIES[match[1]][lang]) || match[1];
        return PATTERNS[i][1][lang].replace('{c}', city);
      }
    }
    return en;
  }

  function apply(lang) {
    if (lang === 'es') return;
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : lang;
    document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = translate(el.getAttribute('data-en'), lang); });
    document.querySelectorAll('[data-en-alt]').forEach(function (el) { el.alt = translate(el.getAttribute('data-en-alt'), lang); });
    document.querySelectorAll('[data-en-href]').forEach(function (el) {
      el.href = el.getAttribute('data-en-href') === '/privacy/' ? PRIVACY[lang] : HOME[lang];
    });
    var missing = document.querySelector('h1[data-when="missing"]');
    var lead = document.querySelector('p[data-when="missing"]');
    if (missing && lead && MISSING[lang]) {
      missing.textContent = MISSING[lang][0];
      lead.textContent = '';
      var link = document.createElement('a');
      link.href = HOME[lang];
      link.textContent = MISSING[lang][1];
      lead.appendChild(link);
    }
    var h1 = Array.prototype.filter.call(document.querySelectorAll('h1'), function (el) { return el.offsetParent !== null; })[0];
    if (h1) document.title = h1.textContent;
  }

  // A text this script adds to the page itself (the Spanish lives in TEXT too).
  function say(en, lang) {
    return lang === 'es' && TEXT[en] && TEXT[en].es ? TEXT[en].es : translate(en, lang);
  }

  return { language: language, translate: translate, apply: apply, say: say, home: HOME, privacy: PRIVACY };
})();

document.addEventListener('DOMContentLoaded', function () { N2GText.apply(N2GText.language()); });

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
  });

  // Above the lead and the store buttons: what someone who already has the app does here.
  function addBox(build) {
    document.addEventListener('DOMContentLoaded', function () {
      var buttons = document.querySelector('.store-buttons');
      if (!buttons) return;
      var before = buttons.previousElementSibling && buttons.previousElementSibling.classList.contains('lead')
        ? buttons.previousElementSibling : buttons;
      var box = document.createElement('div');
      box.className = 'open-app';
      box.style.cssText = 'display:grid;justify-items:center;gap:10px;margin:8px 0 28px';
      build(box, N2GText.language());
      before.parentNode.insertBefore(box, before);
    });
  }
  function paragraph(text, strong) {
    var p = document.createElement('p');
    p.className = 'lead';
    p.style.margin = '0';
    if (strong) p.style.fontWeight = '600';
    p.textContent = text;
    return p;
  }

  var ua = navigator.userAgent || '';
  if (N2GLink.inApp(ua) && (p === 'ios' || p === 'android')) {
    // Inside Instagram, TikTok…: no store on its own; first what someone who already has the app does.
    addBox(function (box, lang) {
      box.appendChild(paragraph(N2GText.say('Already have Nippon2Go?', lang), true));
      if (p === 'android') {
        var a = document.createElement('a');
        a.className = 'button';
        a.href = N2GLink.intent(location.pathname, location.hash, l.play);
        a.textContent = N2GText.say('Open in the app', lang);
        box.appendChild(a);
        return;
      }
      // iOS: the browser's own menu hands the link to the phone, which opens the app on it.
      box.appendChild(paragraph(N2GText.say(/Instagram/.test(ua)
        ? 'Tap ··· at the top right and choose “Open in external browser”. Nippon2Go will open on this screen.'
        : 'Tap ··· at the top right and choose to open in the browser. Nippon2Go will open on this screen.', lang)));
      // The same advice at the bottom of the page would only repeat it.
      var note = document.querySelector('p.note[data-en^="Already have the app?"]');
      if (note) note.style.display = 'none';
    });
    return;
  }
  if (!url || back) return;
  // Go once the page has loaded, so this page stays in history and Back returns to its buttons.
  window.addEventListener('load', function () {
    setTimeout(function () { location.href = url; }, 0);
  });
})();
