<h1 align="center">Google One Tap</h1>

<p align="center"><b>Framework-agnostic drop-in module for Google Sign-In.</b><br>
A lightweight, zero-dependency TypeScript module that integrates <b>Google One Tap</b> and <b>Sign-In with Google</b> (Google Identity Services) into any web app — vanilla JS or any framework (React, Vue, Angular, Lit, …).</p>

<p align="center">
  <a href="https://www.faber04.com/demos/googleOneTap/"><img src="https://img.shields.io/badge/Live_Demo-0ea5e9?style=for-the-badge" alt="Live demo"></a>
  <a href="https://github.com/Faber04/com.faber04.demo.googleOneTap"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/zero--dependency-22c55e" alt="zero dependency">
  <img src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-fbbf24" alt="license">
</p>

---

## The module

| | | | |
|---|---|---|---|
| **Drop-in** | **One Tap + Button** | **Session** | **Typed** |
| `GoogleOneTap.init(config)` injects the GIS script automatically (idempotent) and wires everything up. | Auto One Tap prompt plus the official Google Sign-In button — `context`, `uxMode`, `cancelOnTapOutside`, custom `buttonConfig`. | Restores a previous sign-in from `sessionStorage` on init; `signOut()` and `cancel()` included. | Ships ambient type declarations for the GIS SDK (no `@types/*` needed) and a built-in JWT decoder. |

---

## Quick start

```bash
git clone https://github.com/Faber04/com.faber04.demo.googleOneTap.git
cd com.faber04.demo.googleOneTap
npm install
npm run build        # compile google-one-tap.ts → dist/
npm run serve        # demo at http://localhost:8787
```

Create `config/google-config.js` (gitignored) with your Client ID:

```js
export const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
```

Then in your page:

```html
<div id="google-btn"></div>

<script type="module">
  import GoogleOneTap from './dist/google-one-tap.js';
  import { GOOGLE_CLIENT_ID } from './config/google-config.js';

  GoogleOneTap.init({
    clientId: GOOGLE_CLIENT_ID,
    buttonContainerId: 'google-btn',
    autoPrompt: true,
    onSuccess: ({ user, credential }) => {
      console.log('Welcome, ' + user.name);
      // Send the JWT credential to your backend for verification
    },
    onError: ({ reason }) => console.warn('One Tap skipped:', reason)
  });
</script>
```

`buttonContainerId` also accepts a direct `HTMLElement` reference, so integrating inside a Lit component's Shadow DOM is trivial.

---

## Configuration

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `clientId` | `string` | **required** | OAuth 2.0 Client ID from Google Cloud Console. |
| `onSuccess` | `function` | — | Called with `{ credential, user }` on successful sign-in. |
| `onError` | `function` | — | Called with `{ reason }` when the prompt fails or is dismissed. |
| `buttonContainerId` | `string \| HTMLElement` | — | ID (`#`) or element reference for the official Google button. |
| `autoPrompt` | `boolean` | `true` | Show the One Tap prompt automatically. |
| `context` | `string` | `'signin'` | `'signin'`, `'signup'` or `'use'`. |
| `uxMode` | `string` | `'popup'` | `'popup'` or `'redirect'`. |
| `loginUri` | `string` | — | Required when `uxMode` is `'redirect'`. |
| `cancelOnTapOutside` | `boolean` | `true` | Dismiss the prompt when clicking outside it. |
| `buttonConfig` | `object` | `{}` | Extra options forwarded to `google.accounts.id.renderButton()`. |

### API

- **`init(config)`** — loads the GIS script, renders the Sign-In button, shows the One Tap prompt (unless a session was restored).
- **`signOut(email)`** — revokes the Google session for the given email and clears the stored session.
- **`cancel()`** — programmatically dismisses the One Tap prompt.
- **`decodeJWT(token)`** — decodes a Google ID token payload (client-side only, no signature check).

---

## Security

> **Never trust the client-side decoded profile for authentication.**
> After a successful sign-in, always forward the `credential` (JWT) to your backend and verify it with the [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs) or any standard JWT verification library.

### Getting a Google Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create credentials → OAuth client ID (Web application).
2. In **Authorized JavaScript origins** add only the root origin (e.g. `https://www.faber04.com`) — no subfolders, no trailing slashes, or Google returns "Invalid origin".
3. Configure the OAuth consent screen with scopes `.../auth/userinfo.email` and `.../auth/userinfo.profile`.

---

## Tech stack

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/zero_runtime_deps-22c55e" alt="zero runtime deps">
  <img src="https://img.shields.io/badge/Google_Identity_Services-4285f4?logo=google&logoColor=white" alt="GIS">
</p>

Build: plain `tsc` (`npm run build` / `build:watch`). No runtime dependencies.

## Project structure

```text
.
├── google-one-tap.ts        # Module source (TypeScript)
├── index.html               # Interactive demo page
├── style/style.css          # Demo styles
├── config/google-config.js  # Your Google Client ID (gitignored — create it locally)
├── tsconfig.json            # TypeScript configuration
├── package.json             # Build scripts and dev dependencies
├── dist/                    # Compiled output (generated, gitignored)
│   ├── google-one-tap.js    # Compiled ES module
│   └── google-one-tap.d.ts  # Type declarations
└── node_modules/            # Dev dependencies (gitignored)
```

## Deploy

The demo is served from the `demos/googleOneTap/` subfolder on the web server. Upload `index.html`, `style/style.css`, `dist/` (after `npm run build`) and `config/google-config.js` — all references are relative, so the page works under any subfolder without code changes.

---

## References

- [Google Identity Services documentation](https://developers.google.com/identity/gsi/web)
- [Google One Tap Codelab](https://codelabs.developers.google.com/codelabs/google-one-tap) — official step-by-step guide

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-fbbf24" alt="MIT">
</p>

<p align="center">Built by <a href="https://github.com/Faber04">@Faber04</a> · Faber04 © 2026</p>
