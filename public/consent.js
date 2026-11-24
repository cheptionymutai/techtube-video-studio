/*!
 * Techtube cookie consent banner (Google Consent Mode v2)
 *
 * Load this as the FIRST script in <head> on every page that has Google Tag Manager,
 * gtag.js or the Meta Pixel, i.e. before those snippets:
 *     <script src="/consent.js"></script>
 *
 * What it does
 *  - Sets Consent Mode defaults before any tag loads.
 *      Visitors in the EEA, UK and Switzerland: everything DENIED until they accept.
 *      Everyone else: granted, but the banner is still shown and Decline is honoured.
 *    (Set STRICT_EVERYWHERE = true to deny by default for every visitor.)
 *  - Shows a banner with equal-weight Accept / Decline buttons on a first visit.
 *  - Remembers the choice for 12 months, then asks again.
 *  - window.ttOpenConsent() reopens the banner (used by the button on the privacy page).
 *
 * Google tags (GA4) follow Consent Mode automatically. The Meta Pixel tag in GTM must be
 * set to require "ad_storage" consent (GTM > tag > Advanced Settings > Consent Settings).
 */
(function () {
    'use strict';

    var STRICT_EVERYWHERE = false;
    var STORAGE_KEY = 'tt_consent';
    var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
    var PRIVACY_URL = '/privacypolicy.html';
    var EU_UK_CH = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    function consentState(value) {
        var v = value === 'granted' ? 'granted' : 'denied';
        return { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v };
    }
    function withExtras(base, extras) {
        for (var k in extras) { if (Object.prototype.hasOwnProperty.call(extras, k)) base[k] = extras[k]; }
        return base;
    }

    function readChoice() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var o = JSON.parse(raw);
            if (!o || (o.v !== 'granted' && o.v !== 'denied')) return null;
            if (Date.now() - o.t > MAX_AGE_MS) return null;
            return o.v;
        } catch (e) { return null; }
    }
    function saveChoice(v) {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
    }

    // ---- 1. defaults, before any other tag loads ----
    var stored = readChoice();
    if (stored) {
        gtag('consent', 'default', consentState(stored));
    } else if (STRICT_EVERYWHERE) {
        gtag('consent', 'default', withExtras(consentState('denied'), { wait_for_update: 500 }));
    } else {
        gtag('consent', 'default', consentState('granted'));
        gtag('consent', 'default', withExtras(consentState('denied'), { region: EU_UK_CH, wait_for_update: 500 }));
    }

    // ---- 2. banner ----
    var CSS =
        '#tt-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:760px;margin:0 auto;' +
        'background:#031F14;color:#e8e9e2;border:1px solid rgba(143,205,181,.35);border-radius:18px;padding:18px 20px;' +
        'box-shadow:0 20px 50px rgba(0,0,0,.45);font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
        'display:flex;gap:16px;align-items:center;flex-wrap:wrap}' +
        '#tt-consent p{margin:0;flex:1 1 300px}' +
        '#tt-consent a{color:#8fcdb5;text-decoration:underline}' +
        '#tt-consent .tt-btns{display:flex;gap:10px;flex:0 0 auto}' +
        '#tt-consent button{cursor:pointer;border:0;border-radius:999px;padding:11px 22px;font:700 13px system-ui,sans-serif;letter-spacing:.04em;min-width:96px}' +
        '#tt-consent .tt-accept{background:#8fcdb5;color:#031F14}' +
        '#tt-consent .tt-decline{background:#e8e9e2;color:#031F14}' +
        '#tt-consent button:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
        '@media(max-width:520px){#tt-consent .tt-btns{width:100%}#tt-consent button{flex:1}}';

    function choose(value) {
        saveChoice(value);
        gtag('consent', 'update', consentState(value));
        window.dataLayer.push({ event: 'consent_update', consent_choice: value });
        hide();
    }
    function hide() {
        var el = document.getElementById('tt-consent');
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    function show() {
        if (document.getElementById('tt-consent')) return;
        if (!document.getElementById('tt-consent-css')) {
            var st = document.createElement('style');
            st.id = 'tt-consent-css'; st.appendChild(document.createTextNode(CSS));
            document.head.appendChild(st);
        }
        var box = document.createElement('div');
        box.id = 'tt-consent';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-label', 'Cookie preferences');

        var p = document.createElement('p');
        p.appendChild(document.createTextNode('We use cookies to understand how our site is used and to measure our advertising. You can accept or decline. See our '));
        var a = document.createElement('a'); a.href = PRIVACY_URL; a.appendChild(document.createTextNode('Privacy Policy'));
        p.appendChild(a); p.appendChild(document.createTextNode('.'));

        var btns = document.createElement('div'); btns.className = 'tt-btns';
        var decline = document.createElement('button'); decline.type = 'button'; decline.className = 'tt-decline'; decline.appendChild(document.createTextNode('Decline'));
        var accept = document.createElement('button'); accept.type = 'button'; accept.className = 'tt-accept'; accept.appendChild(document.createTextNode('Accept'));
        decline.addEventListener('click', function () { choose('denied'); });
        accept.addEventListener('click', function () { choose('granted'); });
        btns.appendChild(decline); btns.appendChild(accept);

        box.appendChild(p); box.appendChild(btns);
        document.body.appendChild(box);
    }

    function onReady(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
    }

    window.ttOpenConsent = function () { onReady(show); };
    if (!stored) onReady(show);
})();
