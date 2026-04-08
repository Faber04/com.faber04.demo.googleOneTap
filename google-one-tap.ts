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

// ─── Google Identity Services type declarations ──────────────────────────────
// Minimal ambient types for the GIS SDK (avoids needing @types/google.accounts)

declare namespace google.accounts.id {
  interface CredentialResponse {
    credential: string;
    select_by: string;
    client_id: string;
  }

  interface IdConfiguration {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    context?: 'signin' | 'signup' | 'use';
    ux_mode?: 'popup' | 'redirect';
    login_uri?: string;
    cancel_on_tap_outside?: boolean;
    auto_select?: boolean;
  }

  interface GsiButtonConfiguration {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number;
    locale?: string;
  }

  interface PromptMomentNotification {
    isDisplayMoment: () => boolean;
    isDisplayed: () => boolean;
    isNotDisplayed: () => boolean;
    getNotDisplayedReason: () => string;
    isSkippedMoment: () => boolean;
    getSkippedReason: () => string;
    isDismissedMoment: () => boolean;
    getDismissedReason: () => string;
    getMomentType: () => string;
  }

  interface RevokeTokenResponse {
    successful: boolean;
    error: string;
  }

  function initialize(config: IdConfiguration): void;
  function prompt(callback?: (notification: PromptMomentNotification) => void): void;
  function renderButton(parent: HTMLElement, config: GsiButtonConfiguration): void;
  function disableAutoSelect(): void;
  function cancel(): void;
  function revoke(hint: string, callback: (done: RevokeTokenResponse) => void): void;
}

// ─── Public API Types ────────────────────────────────────────────────────────

/** Decoded Google user profile — available immediately, client-side only. */
export interface GoogleUser {
  /** Google account unique ID (JWT `sub` claim) */
  id: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  /** URL of the user's profile picture */
  picture: string;
  emailVerified: boolean;
}

/** Payload delivered to `onSuccess` after a successful sign-in. */
export interface GoogleOneTapSuccessPayload {
  /** Raw JWT credential — send this to your backend for verification. */
  credential: string;
  /** Decoded user profile (for display only — do NOT trust client-side for auth). */
  user: GoogleUser;
}

/** Payload delivered to `onError` when the prompt is skipped / not shown. */
export interface GoogleOneTapErrorPayload {
  reason: string;
}

/** Configuration object passed to `GoogleOneTap.init()`. */
export interface GoogleOneTapConfig {
  /** (REQUIRED) OAuth 2.0 Client ID from Google Cloud Console. */
  clientId: string;

  /** Called with user info on successful sign-in. */
  onSuccess?: (payload: GoogleOneTapSuccessPayload) => void;

  /** Called when the One Tap prompt is not shown or is dismissed. */
  onError?: (payload: GoogleOneTapErrorPayload) => void;

  /** ID of the DOM element (string) or the actual HTMLElement where the button is rendered. */
  buttonContainerId?: string | HTMLElement;

  /** Show One Tap prompt automatically on init. Default: `true`. */
  autoPrompt?: boolean;

  /** UX context string. Default: `'signin'`. */
  context?: 'signin' | 'signup' | 'use';

  /** Interaction UX mode. Default: `'popup'`. */
  uxMode?: 'popup' | 'redirect';

  /** Required when `uxMode` is `'redirect'`. */
  loginUri?: string;

  /** Close the prompt when the user clicks outside. Default: `true`. */
  cancelOnTapOutside?: boolean;

  /** Extra options forwarded to `google.accounts.id.renderButton()`. */
  buttonConfig?: google.accounts.id.GsiButtonConfiguration;
}

/** Decoded JWT payload (partial — only the claims we care about). */
interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
  [key: string]: unknown;
}

/** Public interface of the GoogleOneTap singleton. */
export interface IGoogleOneTap {
  init(config: GoogleOneTapConfig): void;
  signOut(email: string): void;
  cancel(): void;
  decodeJWT(token: string): JWTPayload | null;
}

// ─── Internal State ──────────────────────────────────────────────────────────

let _config: Required<
  Pick<GoogleOneTapConfig, 'autoPrompt' | 'context' | 'uxMode' | 'cancelOnTapOutside' | 'clientId'>
> &
  Omit<GoogleOneTapConfig, 'autoPrompt' | 'context' | 'uxMode' | 'cancelOnTapOutside'> = {
  clientId: '',
  autoPrompt: true,
  context: 'signin',
  uxMode: 'popup',
  cancelOnTapOutside: true,
  buttonConfig: {},
};

let _initialized = false;
let _sessionRestored = false;
const SESSION_KEY = 'fb04:google1tap';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Decode a JWT payload (base64url) without external libraries.
 * ⚠️  Client-side only — not a security check.
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (e) {
    console.error('[GoogleOneTap] JWT decode error:', e);
    return null;
  }
}

/**
 * Dynamically insert the Google Identity Services script tag.
 * Idempotent — will not add a second tag if already present.
 */
function loadGISScript(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('[GoogleOneTap] Failed to load GIS script.'));
    document.head.appendChild(script);
  });
}

/**
 * Internal credential handler — decodes the JWT and fires `onSuccess`.
 */
function handleCredentialResponse(
  response: google.accounts.id.CredentialResponse
): void {
  const payload = decodeJWT(response.credential);
  if (!payload) return;

  console.info('[GoogleOneTap] ✅ Login successful:', payload.email);

  if (typeof _config.onSuccess === 'function') {
    const successPayload: GoogleOneTapSuccessPayload = {
      credential: response.credential,
      user: {
        id:            payload.sub,
        email:         payload.email,
        name:          payload.name,
        givenName:     payload.given_name,
        familyName:    payload.family_name,
        picture:       payload.picture,
        emailVerified: payload.email_verified,
      },
    };

    // Save session for persistence
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(successPayload));
    } catch (e) {
      console.warn('[GoogleOneTap] Failed to save session to sessionStorage:', e);
    }

    _config.onSuccess(successPayload);
  }
}

// ─── Public Singleton ────────────────────────────────────────────────────────

const GoogleOneTap: IGoogleOneTap = {
  /**
   * Initialise the Google One Tap / Sign-In module.
   * Loads the GIS script if needed, then shows the prompt and/or button.
   */
  init(config: GoogleOneTapConfig): void {
    if (!config.clientId) {
      throw new Error('[GoogleOneTap] clientId is required.');
    }

    _config = {
      autoPrompt: true,
      context: 'signin',
      uxMode: 'popup',
      cancelOnTapOutside: true,
      buttonConfig: {},
      ...config,
    };

    // 1. Check for existing session in sessionStorage
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const payload = JSON.parse(savedSession) as GoogleOneTapSuccessPayload;
        _sessionRestored = true;
        console.info('[GoogleOneTap] Restoring session from sessionStorage…');
        // Delay slightly to ensure script is loaded and ready if needed
        setTimeout(() => _config.onSuccess?.(payload), 0);
      } catch (e) {
        console.warn('[GoogleOneTap] Failed to restore session:', e);
        sessionStorage.removeItem(SESSION_KEY);
      }
    }

    loadGISScript()
      .then(() => {
        google.accounts.id.initialize({
          client_id:             _config.clientId,
          callback:              handleCredentialResponse,
          context:               _config.context,
          ux_mode:               _config.uxMode,
          login_uri:             _config.loginUri,
          cancel_on_tap_outside: _config.cancelOnTapOutside,
        });

        // Render the official Google Sign-In button
        if (_config.buttonContainerId) {
          const container = typeof _config.buttonContainerId === 'string'
            ? document.getElementById(_config.buttonContainerId)
            : _config.buttonContainerId;

          if (container instanceof HTMLElement) {
            google.accounts.id.renderButton(container, {
              theme:          'outline',
              size:           'large',
              type:           'standard',
              shape:          'rectangular',
              logo_alignment: 'left',
              ...(_config.buttonConfig ?? {}),
            });
          } else {
            console.warn(
              `[GoogleOneTap] Container #${_config.buttonContainerId} not found.`
            );
          }
        }

        // Show One Tap prompt (only if no session was restored)
        if (_config.autoPrompt && !_sessionRestored) {
          google.accounts.id.prompt(
            (notification: google.accounts.id.PromptMomentNotification) => {
              if (
                notification.isNotDisplayed() ||
                notification.isSkippedMoment()
              ) {
                const reason =
                  notification.getNotDisplayedReason?.() ||
                  notification.getSkippedReason?.() ||
                  'unknown';
                console.warn('[GoogleOneTap] Prompt not shown:', reason);
                _config.onError?.({ reason });
              }
            }
          );
        }

        _initialized = true;
        console.info('[GoogleOneTap] Initialized ✓');
      })
      .catch((err: Error) => {
        console.error('[GoogleOneTap] Initialization failed:', err);
        _config.onError?.({ reason: err.message });
      });
  },

  /**
   * Revoke the Google session for the given email address.
   */
  signOut(email: string): void {
    // Clear persisted session
    sessionStorage.removeItem(SESSION_KEY);
    _sessionRestored = false;

    if (!_initialized) return;
    google.accounts.id.revoke(email, (done) => {
      console.info('[GoogleOneTap] Sign-out complete:', done);
    });
  },

  /**
   * Programmatically hide the One Tap prompt.
   */
  cancel(): void {
    if (!_initialized) return;
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
  (window as unknown as { GoogleOneTap: IGoogleOneTap }).GoogleOneTap = GoogleOneTap;
}
