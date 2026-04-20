/**
 * Zero Trust Login Button  —  OAuth2 Authorization Code + PKCE
 * =============================================================
 * Drop this on any external website to add "Sign in with Google" backed by
 * your Zero Trust auth-service — no backend required on the external site.
 *
 * Flow (identical to "Login with Google / Facebook"):
 *   1. User clicks the login button
 *   2. Browser redirects to  GET {authBaseURL}/oauth2/authorize?client_id=…&code_challenge=…
 *   3. If not logged in → auth-service sends user to Google via oauth2-proxy
 *   4. After Google login → back to /oauth2/authorize → short-lived code issued
 *   5. Browser redirected to your  callbackPath?code=…&state=…
 *   6. This script exchanges code + verifier for a JWT via POST /oauth2/token
 *   7. JWT stored in localStorage; user redirected to where they were going
 *   8. All subsequent API calls carry  Authorization: Bearer <JWT>
 *
 * Quick start
 * -----------
 *   <script src="login-button.js"></script>
 *   <script>
 *     ZeroTrust.init({
 *       authBaseURL:  'https://auth.yourdomain.com',  // your EXTERNAL_LOGIN_BASE_URL
 *       clientId:     'abc123…',                      // client_id from the CMS OAuth Apps page
 *       callbackPath: '/auth/callback',               // a path on THIS site (must be a registered redirect URI)
 *     });
 *
 *     // Render a Google-style login button into a container:
 *     ZeroTrust.renderButton('#login-container');
 *
 *     // Or check who is logged in:
 *     ZeroTrust.getUser().then(user => {
 *       if (user) console.log('Hello', user.email);
 *       else      ZeroTrust.login();
 *     });
 *   </script>
 *
 * Nginx config needed on your auth server
 * ----------------------------------------
 *   # Must come BEFORE the general /oauth2/ → oauth2-proxy block
 *   location /oauth2/authorize { proxy_pass http://127.0.0.1:5000/oauth2/authorize; }
 *   location /oauth2/token     { proxy_pass http://127.0.0.1:5000/oauth2/token;     }
 *   location /userinfo         { proxy_pass http://127.0.0.1:5000/userinfo;         }
 *
 * oauth2-proxy flag needed
 * -------------------------
 *   --whitelist-domain=auth.yourdomain.com
 *   (so oauth2-proxy can redirect back to /oauth2/authorize after Google login)
 */

(function (global) {
  "use strict";

  // ── Storage keys ────────────────────────────────────────────────────────────
  var KEY_TOKEN = "zt_token";
  var KEY_VERIFIER = "zt_pkce_verifier";
  var KEY_STATE = "zt_oauth_state";
  var KEY_RETURN = "zt_return_url";

  var cfg = {};

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * init — call once before using any other method.
   * @param {object} opts
   * @param {string} opts.authBaseURL    Public URL of the auth-service (no trailing slash)
   * @param {string} opts.clientId       client_id from the CMS OAuth Apps page
   * @param {string} [opts.callbackPath] Path on THIS site that handles the ?code= redirect
   *                                     Default: '/auth/callback'
   */
  function init(opts) {
    if (!opts.authBaseURL)
      throw new Error("ZeroTrust.init: authBaseURL is required");
    if (!opts.clientId) throw new Error("ZeroTrust.init: clientId is required");
    cfg.authBaseURL = opts.authBaseURL.replace(/\/$/, "");
    cfg.clientId = opts.clientId;
    cfg.callbackPath = opts.callbackPath || "/auth/callback";
    cfg.onBeforeRedirect =
      typeof opts.onBeforeRedirect === "function"
        ? opts.onBeforeRedirect
        : null;

    // Automatically handle the OAuth2 callback if we're on that page.
    if (window.location.pathname === cfg.callbackPath) {
      _handleCallback();
    }
  }

  /**
   * login — start the OAuth2 PKCE flow.
   * @param {string} [returnTo]  URL to redirect to after successful login.
   *                              Defaults to current page.
   */
  function login(returnTo) {
    _assertInit();
    var redirectURI = window.location.origin + cfg.callbackPath;
    var verifier = _randomBase64url(64);
    var state = _randomBase64url(16);

    sessionStorage.setItem(KEY_VERIFIER, verifier);
    sessionStorage.setItem(KEY_STATE, state);
    sessionStorage.setItem(KEY_RETURN, returnTo || window.location.href);

    _sha256(verifier).then(function (challenge) {
      var url =
        cfg.authBaseURL +
        "/oauth2/authorize" +
        "?response_type=code" +
        "&client_id=" +
        encodeURIComponent(cfg.clientId) +
        "&redirect_uri=" +
        encodeURIComponent(redirectURI) +
        "&code_challenge=" +
        encodeURIComponent(challenge) +
        "&code_challenge_method=S256" +
        "&state=" +
        encodeURIComponent(state);
      window.location.href = url;
    });
  }

  /** logout — remove stored token and optionally redirect. */
  function logout(redirectTo) {
    localStorage.removeItem(KEY_TOKEN);
    if (redirectTo) window.location.href = redirectTo;
  }

  /**
   * getToken — returns the stored JWT string, or null.
   * Does not verify expiry client-side — use getUser() for server-verified info.
   */
  function getToken() {
    return localStorage.getItem(KEY_TOKEN);
  }

  /**
   * getUser — calls /userinfo to validate the stored token.
   * Returns Promise<{email, sub, groups, aud}> or null if not logged in.
   */
  function getUser() {
    _assertInit();
    var token = getToken();
    if (!token) return Promise.resolve(null);

    return fetch(cfg.authBaseURL + "/userinfo", {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        if (res.status === 401) {
          localStorage.removeItem(KEY_TOKEN);
          return null;
        }
        if (!res.ok) return null;
        return res.json();
      })
      .catch(function () {
        return null;
      });
  }

  /**
   * getAuthHeader — returns { Authorization: 'Bearer <token>' } or {}
   * Use when calling your protected APIs:
   *
   *   fetch('/api/data', { headers: Object.assign({}, ZeroTrust.getAuthHeader()) })
   */
  function getAuthHeader() {
    var token = getToken();
    return token ? { Authorization: "Bearer " + token } : {};
  }

  /**
   * renderButton — insert a Google-style "Sign in with Google" button.
   * @param {string|Element} container   CSS selector or DOM element
   * @param {object}         [opts]
   * @param {string}         [opts.label]     Button text  (default: 'Sign in with Google')
   * @param {string}         [opts.returnTo]  Where to go after login
   */
  function renderButton(container, opts) {
    _assertInit();
    var el =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (!el) {
      console.warn("ZeroTrust.renderButton: container not found", container);
      return;
    }

    opts = opts || {};
    var label = opts.label || "Sign in with Google";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"' +
      ' style="margin-right:10px;vertical-align:middle;flex-shrink:0">' +
      '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0' +
      ' 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
      '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94' +
      'c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
      '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59' +
      'l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
      '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6' +
      "c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19" +
      'C6.51 42.62 14.62 48 24 48z"/>' +
      "</svg>" +
      _esc(label);

    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      padding: "10px 20px",
      border: "1px solid #dadce0",
      borderRadius: "4px",
      background: "#fff",
      color: "#3c4043",
      fontSize: "14px",
      fontFamily: "'Google Sans',Roboto,sans-serif",
      fontWeight: "500",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,.12)",
      transition: "box-shadow .15s",
      userSelect: "none",
    });
    btn.addEventListener("mouseover", function () {
      btn.style.boxShadow = "0 2px 6px rgba(0,0,0,.18)";
    });
    btn.addEventListener("mouseout", function () {
      btn.style.boxShadow = "0 1px 3px rgba(0,0,0,.12)";
    });
    btn.addEventListener("click", function () {
      login(opts.returnTo);
    });

    el.appendChild(btn);
  }

  // ── Internal: OAuth2 callback handler ────────────────────────────────────────

  function _handleCallback() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get("code");
    var state = params.get("state");
    var errParam = params.get("error");

    if (errParam) {
      console.error(
        "ZeroTrust: OAuth2 error —",
        errParam,
        params.get("error_description"),
      );
      return;
    }
    if (!code) return; // not a callback, nothing to do

    var savedState = sessionStorage.getItem(KEY_STATE);
    var verifier = sessionStorage.getItem(KEY_VERIFIER);
    var returnTo = sessionStorage.getItem(KEY_RETURN) || "/";
    var redirectURI = window.location.origin + cfg.callbackPath;

    sessionStorage.removeItem(KEY_STATE);
    sessionStorage.removeItem(KEY_VERIFIER);
    sessionStorage.removeItem(KEY_RETURN);

    if (state !== savedState) {
      console.error("ZeroTrust: state mismatch — possible CSRF. Aborting.");
      return;
    }

    // Exchange authorization code for access token
    var body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cfg.clientId,
      code: code,
      redirect_uri: redirectURI,
      code_verifier: verifier,
    });

    fetch(cfg.authBaseURL + "/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
      .then(function (res) {
        if (!res.ok)
          return res.json().then(function (e) {
            throw new Error(e.error + ": " + e.error_description);
          });
        return res.json();
      })
      .then(function (data) {
        localStorage.setItem(KEY_TOKEN, data.access_token);
        // Clean up the ?code=… from the URL before redirecting
        history.replaceState(null, "", window.location.pathname);

        if (cfg.onBeforeRedirect) {
          try {
            var shouldRedirect = cfg.onBeforeRedirect({
              returnTo: returnTo,
              token: data.access_token,
              tokenType: data.token_type,
              expiresIn: data.expires_in,
            });
            if (shouldRedirect === false) return;
          } catch (hookErr) {
            console.error("ZeroTrust: onBeforeRedirect failed —", hookErr);
          }
        }

        window.location.replace(returnTo);
      })
      .catch(function (err) {
        console.error("ZeroTrust: token exchange failed —", err.message);
      });
  }

  // ── Internal: PKCE + crypto helpers ─────────────────────────────────────────

  /** Generate a cryptographically random base64url string of `len` bytes. */
  function _randomBase64url(len) {
    var arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return _base64url(arr);
  }

  /** SHA-256 of a string, returned as base64url. */
  function _sha256(str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return _base64url(new Uint8Array(buf));
    });
  }

  /** Encode a Uint8Array to base64url (no padding). */
  function _base64url(arr) {
    var b64 = btoa(String.fromCharCode.apply(null, arr));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  function _esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function _assertInit() {
    if (!cfg.authBaseURL)
      throw new Error("ZeroTrust: call ZeroTrust.init() first");
  }

  // ── Export ───────────────────────────────────────────────────────────────────

  global.ZeroTrust = {
    init: init,
    login: login,
    logout: logout,
    getToken: getToken,
    getUser: getUser,
    getAuthHeader: getAuthHeader,
    renderButton: renderButton,
  };
})(window);
