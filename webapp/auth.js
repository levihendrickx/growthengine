/* ═══════════════════════════════════════════════════════════
   GROWTH ENGINE — auth.js
   Login / account creation modal
   Providers: Google · Apple · Email
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────────────
     Fill these in when you set up your OAuth apps.
     Until then the buttons run a dev-mode placeholder flow.
  ──────────────────────────────────────────────────────────── */
  const CFG = {
    googleClientId:  '',   // '123456789.apps.googleusercontent.com'
    appleClientId:   '',   // 'com.yourcompany.growthengine'
    appleRedirectURI: window.location.origin + '/auth/apple/callback',
  };

  /* ── MODULE STATE ─────────────────────────────────────────── */
  let _open     = false;
  let _view     = 'main';   // 'main' | 'email-signup' | 'email-login'
  let _prevFocus = null;

  /* ── DOM REFS (populated in build) ──────────────────────────── */
  let overlay, modal, views = {};

  /* ─────────────────────────────────────────────────────────────
     BUILD
  ───────────────────────────────────────────────────────────── */
  function build() {
    overlay = document.createElement('div');
    overlay.id = 'am-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
<div id="am-modal" role="dialog" aria-modal="true" aria-labelledby="am-title" tabindex="-1">

  <!-- ── Header: logo + close ── -->
  <div class="am-head">
    <div class="am-logo" aria-label="Growth Engine">
      <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="36" height="36" aria-hidden="true">
        <defs>
          <linearGradient id="am-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stop-color="#818cf8"/>
            <stop offset="50%" stop-color="#4a3aff"/>
            <stop offset="100%" stop-color="#7c3aed"/>
          </linearGradient>
        </defs>
        <path d="M20 3 L23 14 L33 18 L23 22 L20 33 L17 22 L7 18 L17 14 Z" fill="url(#am-grad)"/>
      </svg>
    </div>
    <button class="am-close" id="am-close" aria-label="Close dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- ══════════════════════════════════════════
       VIEW 1 — main (Google / Apple / Email)
  ══════════════════════════════════════════════ -->
  <div class="am-view" id="am-v-main">

    <div class="am-titles">
      <div class="am-eyebrow">Start analyzing.</div>
      <h2 class="am-headline" id="am-title">Create your free account</h2>
      <p class="am-sub">Connect your ad data and find your first winning patterns in minutes.</p>
    </div>

    <div class="am-oauth">
      <button class="am-oauth-btn" id="am-btn-google" aria-label="Continue with Google">
        <span class="am-btn-ico" aria-hidden="true">
          <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.92v2.32A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.92A9 9 0 0 0 0 9c0 1.45.35 2.83.92 4.04l3.05-2.32z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .92 4.96l3.05 2.32C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
        </span>
        Continue with Google
      </button>

      <button class="am-oauth-btn" id="am-btn-apple" aria-label="Continue with Apple">
        <span class="am-btn-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#1a1a1a" width="18" height="18">
            <path d="M16.37 12.62c-.03-2.82 2.3-4.18 2.4-4.24-1.31-1.92-3.35-2.18-4.07-2.21-1.73-.18-3.38 1.02-4.26 1.02-.89 0-2.24-1-3.69-.97-1.9.03-3.65 1.1-4.62 2.8-1.97 3.42-.5 8.49 1.42 11.27.94 1.36 2.06 2.89 3.51 2.83 1.41-.06 1.95-.91 3.66-.91 1.7 0 2.18.91 3.67.88 1.52-.03 2.48-1.39 3.41-2.76 1.07-1.59 1.51-3.13 1.54-3.21-.03-.01-2.95-1.13-2.97-4.5zM13.6 4.34c.78-.95 1.31-2.27 1.16-3.59-1.13.05-2.5.75-3.31 1.7-.72.83-1.36 2.18-1.19 3.47 1.26.1 2.55-.64 3.34-1.58z"/>
          </svg>
        </span>
        Continue with Apple
      </button>
    </div>

    <div class="am-divider" aria-hidden="true">or</div>

    <button class="am-email-btn" id="am-btn-email">Continue with email</button>

    <p class="am-legal">
      By continuing, you agree to our
      <a href="#" tabindex="0">Terms of Service</a>
      and
      <a href="#" tabindex="0">Privacy Policy</a>.
    </p>

    <div class="am-sso">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span>SSO available on Business and Enterprise plans</span>
    </div>

  </div><!-- /am-v-main -->

  <!-- ══════════════════════════════════════════
       VIEW 2 — email signup
  ══════════════════════════════════════════════ -->
  <div class="am-view am-view--hidden" id="am-v-signup">

    <button class="am-back" id="am-back-signup" aria-label="Back to sign-in options">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true">
        <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
      </svg>
      Back
    </button>

    <div class="am-titles">
      <h2 class="am-headline">Create account with email</h2>
    </div>

    <form class="am-form" id="am-form-signup" novalidate>
      <div class="am-field">
        <label class="am-label" for="am-signup-email">Email address</label>
        <input class="am-input" id="am-signup-email" type="email"
               autocomplete="email" placeholder="you@company.com" required>
      </div>
      <div class="am-field">
        <label class="am-label" for="am-signup-pw">Password</label>
        <input class="am-input" id="am-signup-pw" type="password"
               autocomplete="new-password" placeholder="Create a password (min. 8 chars)" required minlength="8">
      </div>
      <div class="am-error" id="am-err-signup" role="alert" aria-live="polite"></div>
      <button class="am-email-btn" type="submit" id="am-submit-signup">Create account</button>
    </form>

    <p class="am-switch">
      Already have an account?
      <button class="am-switch-btn" id="am-to-login" type="button">Sign in</button>
    </p>

  </div><!-- /am-v-signup -->

  <!-- ══════════════════════════════════════════
       VIEW 3 — email login
  ══════════════════════════════════════════════ -->
  <div class="am-view am-view--hidden" id="am-v-login">

    <button class="am-back" id="am-back-login" aria-label="Back to sign-in options">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true">
        <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
      </svg>
      Back
    </button>

    <div class="am-titles">
      <h2 class="am-headline">Sign in with email</h2>
    </div>

    <form class="am-form" id="am-form-login" novalidate>
      <div class="am-field">
        <label class="am-label" for="am-login-email">Email address</label>
        <input class="am-input" id="am-login-email" type="email"
               autocomplete="email" placeholder="you@company.com" required>
      </div>
      <div class="am-field am-field--pw">
        <div class="am-label-row">
          <label class="am-label" for="am-login-pw">Password</label>
          <button class="am-forgot" id="am-forgot" type="button">Forgot password?</button>
        </div>
        <input class="am-input" id="am-login-pw" type="password"
               autocomplete="current-password" placeholder="Your password" required>
      </div>
      <div class="am-error" id="am-err-login" role="alert" aria-live="polite"></div>
      <button class="am-email-btn" type="submit" id="am-submit-login">Sign in</button>
    </form>

    <p class="am-switch">
      Don't have an account?
      <button class="am-switch-btn" id="am-to-signup" type="button">Create account</button>
    </p>

  </div><!-- /am-v-login -->

</div><!-- /am-modal -->
`;

    document.body.appendChild(overlay);

    // Cache refs
    modal        = document.getElementById('am-modal');
    views.main   = document.getElementById('am-v-main');
    views.signup = document.getElementById('am-v-signup');
    views.login  = document.getElementById('am-v-login');

    wire();
  }

  /* ─────────────────────────────────────────────────────────────
     WIRE EVENTS
  ───────────────────────────────────────────────────────────── */
  function wire() {
    // Close
    document.getElementById('am-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && _open) close(); });

    // OAuth
    document.getElementById('am-btn-google').addEventListener('click', doGoogle);
    document.getElementById('am-btn-apple').addEventListener('click',  doApple);

    // Email flow
    document.getElementById('am-btn-email').addEventListener('click',    () => switchView('signup'));
    document.getElementById('am-back-signup').addEventListener('click',  () => switchView('main'));
    document.getElementById('am-back-login').addEventListener('click',   () => switchView('main'));
    document.getElementById('am-to-login').addEventListener('click',     () => switchView('login'));
    document.getElementById('am-to-signup').addEventListener('click',    () => switchView('signup'));

    // Forms
    document.getElementById('am-form-signup').addEventListener('submit', doEmailSignup);
    document.getElementById('am-form-login').addEventListener('submit',  doEmailLogin);
    document.getElementById('am-forgot').addEventListener('click',       doForgot);

    // Focus trap
    modal.addEventListener('keydown', trapFocus);
  }

  /* ─────────────────────────────────────────────────────────────
     OPEN / CLOSE
  ───────────────────────────────────────────────────────────── */
  function open() {
    if (_open) return;
    _open = true;
    _prevFocus = document.activeElement;
    switchView('main', false);
    overlay.removeAttribute('aria-hidden');
    overlay.classList.add('am-overlay--on');
    document.body.classList.add('am-body--locked');
    requestAnimationFrame(() => modal.focus());
  }

  function close() {
    if (!_open) return;
    _open = false;
    overlay.classList.remove('am-overlay--on');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('am-body--locked');
    if (_prevFocus) _prevFocus.focus();
  }

  /* ─────────────────────────────────────────────────────────────
     VIEW SWITCH
  ───────────────────────────────────────────────────────────── */
  function switchView(name, focusFirst = true) {
    _view = name;
    const keyMap = { main: 'main', signup: 'signup', login: 'login' };
    Object.keys(views).forEach(k => {
      views[k].classList.toggle('am-view--hidden', k !== keyMap[name]);
    });
    clearErr('signup');
    clearErr('login');
    if (focusFirst) {
      const firstInput = views[keyMap[name]]?.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 60);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     FOCUS TRAP
  ───────────────────────────────────────────────────────────── */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const els = [...modal.querySelectorAll(
      'button:not([disabled]):not(.am-view--hidden button), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.closest('.am-view--hidden'));
    if (!els.length) return;
    const first = els[0];
    const last  = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  /* ─────────────────────────────────────────────────────────────
     AUTH HANDLERS
  ───────────────────────────────────────────────────────────── */

  /* --- Google --- */
  async function doGoogle() {
    const btn = document.getElementById('am-btn-google');
    setBusy(btn, true);
    try {
      if (!CFG.googleClientId) {
        // Dev mode: simulate success
        console.info('[Auth] Google — set CFG.googleClientId to enable real OAuth.');
        await delay(900);
        close();
        return;
      }
      /* Production (Google Identity Services):
         google.accounts.id.initialize({
           client_id: CFG.googleClientId,
           callback: onGoogleToken,
           ux_mode: 'popup',
         });
         google.accounts.id.prompt();
      */
    } catch (err) {
      console.error('[Auth] Google error', err);
    } finally {
      setBusy(btn, false);
    }
  }

  /* --- Apple --- */
  async function doApple() {
    const btn = document.getElementById('am-btn-apple');
    setBusy(btn, true);
    try {
      if (!CFG.appleClientId) {
        console.info('[Auth] Apple — set CFG.appleClientId to enable real OAuth.');
        await delay(900);
        close();
        return;
      }
      /* Production (Sign in with Apple JS):
         AppleID.auth.init({
           clientId:    CFG.appleClientId,
           redirectURI: CFG.appleRedirectURI,
           scope: 'email name',
           usePopup: true,
         });
         const resp = await AppleID.auth.signIn();
         onAppleToken(resp);
      */
    } catch (err) {
      console.error('[Auth] Apple error', err);
    } finally {
      setBusy(btn, false);
    }
  }

  /* --- Email signup --- */
  function doEmailSignup(e) {
    e.preventDefault();
    const email = document.getElementById('am-signup-email').value.trim();
    const pw    = document.getElementById('am-signup-pw').value;
    const btn   = document.getElementById('am-submit-signup');
    clearErr('signup');

    if (!validEmail(email)) return showErr('signup', 'Please enter a valid email address.');
    if (pw.length < 8)       return showErr('signup', 'Password must be at least 8 characters.');

    setBusy(btn, true, 'Creating account…');

    // ── Wire your auth provider here ────────────────────────────
    delay(1200).then(() => {
      setBusy(btn, false, 'Create account');
      console.info('[Auth] Signup:', email);
      close();
      /* After close → trigger onboarding:
         window.dispatchEvent(new CustomEvent('auth:signup', { detail: { email } }));
      */
    }).catch(() => {
      setBusy(btn, false, 'Create account');
      showErr('signup', 'Something went wrong. Please try again.');
    });
  }

  /* --- Email login --- */
  function doEmailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('am-login-email').value.trim();
    const pw    = document.getElementById('am-login-pw').value;
    const btn   = document.getElementById('am-submit-login');
    clearErr('login');

    if (!validEmail(email)) return showErr('login', 'Please enter a valid email address.');
    if (!pw)                 return showErr('login', 'Please enter your password.');

    setBusy(btn, true, 'Signing in…');

    delay(1200).then(() => {
      setBusy(btn, false, 'Sign in');
      console.info('[Auth] Login:', email);
      close();
    }).catch(() => {
      setBusy(btn, false, 'Sign in');
      showErr('login', 'Incorrect email or password.');
    });
  }

  /* --- Forgot password --- */
  function doForgot() {
    const email = document.getElementById('am-login-email').value.trim();
    if (!validEmail(email)) {
      return showErr('login', 'Enter your email above first, then click "Forgot password?".');
    }
    // Wire to your reset endpoint here
    console.info('[Auth] Password reset:', email);
    showErr('login', `✓ Reset link sent to ${email}.`);
    document.getElementById('am-err-login').style.color = '#16a34a';
  }

  /* ─────────────────────────────────────────────────────────────
     UI HELPERS
  ───────────────────────────────────────────────────────────── */
  const SPINNER_SVG = `<svg class="am-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.5" stroke-linecap="round" width="15" height="15" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
  </svg>`;

  function setBusy(btn, busy, label) {
    if (busy) {
      btn._orig    = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `${SPINNER_SVG}<span>${label || 'Connecting…'}</span>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn._orig || label || btn.innerHTML;
    }
  }

  function showErr(form, msg) {
    const el = document.getElementById(`am-err-${form}`);
    if (el) { el.textContent = msg; el.classList.add('am-error--on'); el.style.color = ''; }
  }

  function clearErr(form) {
    const el = document.getElementById(`am-err-${form}`);
    if (el) { el.textContent = ''; el.classList.remove('am-error--on'); el.style.color = ''; }
  }

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ─────────────────────────────────────────────────────────────
     SIDEBAR SIGN-IN BUTTON
  ───────────────────────────────────────────────────────────── */
  function addSidebarBtn() {
    const footer = document.querySelector('.sidebar-footer');
    if (!footer) return;
    const btn = document.createElement('button');
    btn.className = 'am-sidebar-btn';
    btn.id = 'am-sidebar-open';
    btn.setAttribute('aria-label', 'Sign in or create account');
    btn.innerHTML = `
      <span class="am-sidebar-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20a8 8 0 0 1 16 0"/>
        </svg>
      </span>
      <span>Sign in</span>
    `;
    btn.addEventListener('click', open);
    footer.prepend(btn);
  }

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    build();
    addSidebarBtn();
    // Public API — lets other scripts trigger the modal
    window.authModal = { open, close };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
