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
declare const GoogleOneTap: IGoogleOneTap;
export default GoogleOneTap;
//# sourceMappingURL=google-one-tap.d.ts.map