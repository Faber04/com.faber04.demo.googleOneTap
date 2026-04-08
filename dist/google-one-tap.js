/**
 * Google One Tap — Agnostic Drop-in Module
 * =========================================
 * Version: 2.0.0 (TypeScript)
 *
 * Usage:
 *   1. Compile with `tsc` → produces `google-one-tap.js`
 *   2. Include the compiled JS in your page (or import as ES module)
 *   3. Call GoogleOneTap.init({ clientId: 'YOUR_CLIENT_ID', ... })
 *
 * No runtime dependency. Works in any HTML page.
 */
// ─── Internal State ──────────────────────────────────────────────────────────
let _config = {
    clientId: '',
    autoPrompt: true,
    context: 'signin',
    uxMode: 'popup',
    cancelOnTapOutside: true,
    buttonConfig: {},
};
let _initialized = false;
// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Decode a JWT payload (base64url) without external libraries.
 * ⚠️  Client-side only — not a security check.
 */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''));
        return JSON.parse(jsonPayload);
    }
    catch (e) {
        console.error('[GoogleOneTap] JWT decode error:', e);
        return null;
    }
}
/**
 * Dynamically insert the Google Identity Services script tag.
 * Idempotent — will not add a second tag if already present.
 */
function loadGISScript() {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('[GoogleOneTap] Failed to load GIS script.'));
        document.head.appendChild(script);
    });
}
/**
 * Internal credential handler — decodes the JWT and fires `onSuccess`.
 */
function handleCredentialResponse(response) {
    const payload = decodeJWT(response.credential);
    if (!payload)
        return;
    console.info('[GoogleOneTap] ✅ Login successful:', payload.email);
    if (typeof _config.onSuccess === 'function') {
        _config.onSuccess({
            credential: response.credential,
            user: {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                givenName: payload.given_name,
                familyName: payload.family_name,
                picture: payload.picture,
                emailVerified: payload.email_verified,
            },
        });
    }
}
// ─── Public Singleton ────────────────────────────────────────────────────────
const GoogleOneTap = {
    /**
     * Initialise the Google One Tap / Sign-In module.
     * Loads the GIS script if needed, then shows the prompt and/or button.
     */
    init(config) {
        if (!config.clientId) {
            throw new Error('[GoogleOneTap] clientId is required.');
        }
        _config = Object.assign({ autoPrompt: true, context: 'signin', uxMode: 'popup', cancelOnTapOutside: true, buttonConfig: {} }, config);
        loadGISScript()
            .then(() => {
            var _a;
            google.accounts.id.initialize({
                client_id: _config.clientId,
                callback: handleCredentialResponse,
                context: _config.context,
                ux_mode: _config.uxMode,
                login_uri: _config.loginUri,
                cancel_on_tap_outside: _config.cancelOnTapOutside,
            });
            // Render the official Google Sign-In button
            if (_config.buttonContainerId) {
                const container = typeof _config.buttonContainerId === 'string'
                    ? document.getElementById(_config.buttonContainerId)
                    : _config.buttonContainerId;
                if (container instanceof HTMLElement) {
                    google.accounts.id.renderButton(container, Object.assign({ theme: 'outline', size: 'large', type: 'standard', shape: 'rectangular', logo_alignment: 'left' }, ((_a = _config.buttonConfig) !== null && _a !== void 0 ? _a : {})));
                }
                else {
                    console.warn(`[GoogleOneTap] Container #${_config.buttonContainerId} not found.`);
                }
            }
            // Show One Tap prompt
            if (_config.autoPrompt) {
                google.accounts.id.prompt((notification) => {
                    var _a, _b, _c;
                    if (notification.isNotDisplayed() ||
                        notification.isSkippedMoment()) {
                        const reason = ((_a = notification.getNotDisplayedReason) === null || _a === void 0 ? void 0 : _a.call(notification)) ||
                            ((_b = notification.getSkippedReason) === null || _b === void 0 ? void 0 : _b.call(notification)) ||
                            'unknown';
                        console.warn('[GoogleOneTap] Prompt not shown:', reason);
                        (_c = _config.onError) === null || _c === void 0 ? void 0 : _c.call(_config, { reason });
                    }
                });
            }
            _initialized = true;
            console.info('[GoogleOneTap] Initialized ✓');
        })
            .catch((err) => {
            var _a;
            console.error('[GoogleOneTap] Initialization failed:', err);
            (_a = _config.onError) === null || _a === void 0 ? void 0 : _a.call(_config, { reason: err.message });
        });
    },
    /**
     * Revoke the Google session for the given email address.
     */
    signOut(email) {
        if (!_initialized)
            return;
        google.accounts.id.revoke(email, (done) => {
            console.info('[GoogleOneTap] Sign-out complete:', done);
        });
    },
    /**
     * Programmatically hide the One Tap prompt.
     */
    cancel() {
        if (!_initialized)
            return;
        google.accounts.id.cancel();
    },
    /**
     * Decode a Google JWT for display purposes (client-side, no signature check).
     */
    decodeJWT,
};
// ─── Exports ─────────────────────────────────────────────────────────────────
export default GoogleOneTap;
// UMD-style global for plain HTML pages (no bundler)
if (typeof window !== 'undefined') {
    window.GoogleOneTap = GoogleOneTap;
}
//# sourceMappingURL=google-one-tap.js.map