/* ═══════════════════════════════════════════════════════════
   GROWTH ENGINE — supabase.js
   Supabase client — initialised from /api/config
   Only the public anon key is ever used here.
   The service-role key never touches client-side code.
   ═══════════════════════════════════════════════════════════ */

;(function () {
  'use strict';

  let _resolve, _reject;

  /**
   * window.sbReady  — Promise<SupabaseClient>
   * Await this anywhere before making Supabase calls.
   * Resolves once /api/config has loaded and the client is created.
   */
  window.sbReady = new Promise((res, rej) => {
    _resolve = res;
    _reject  = rej;
  });

  async function init() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error(`Config endpoint returned ${res.status}`);
      const cfg = await res.json();

      console.log('[Supabase] Config received:', {
        hasUrl: !!cfg.supabaseUrl,
        hasKey: !!cfg.supabaseAnonKey,
        url: cfg.supabaseUrl || '(empty)',
        keyPrefix: cfg.supabaseAnonKey ? cfg.supabaseAnonKey.slice(0, 20) + '…' : '(empty)',
      });

      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        console.error(
          '[Supabase] ❌ Not configured — /api/config returned empty values.\n' +
          'Check that your .env file has SUPABASE_URL and SUPABASE_ANON_KEY,\n' +
          'and that the server was restarted after editing .env.'
        );
        _resolve(null);
        return;
      }

      // window.supabase is the namespace injected by the CDN bundle
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('Supabase CDN script not loaded — check index.html script tag.');
      }

      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: {
          autoRefreshToken:   true,
          persistSession:     true,
          detectSessionInUrl: true,  // handles OAuth code + magic-link hash
        },
      });

      console.log('[Supabase] ✅ Client ready.');
      window._sb = client;
      _resolve(client);
    } catch (err) {
      console.error('[Supabase] ❌ Init failed:', err.message);
      _resolve(null); // graceful degradation — not a crash
    }
  }

  init();
})();
