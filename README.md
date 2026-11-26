# 🔐 Google One Tap — Framework-Agnostic Drop-In Module

A lightweight, zero-dependency TypeScript module for integrating **Google One Tap** and **Sign-In with Google** (Google Identity Services) into any web application.

🚀 **[View the live demo](https://www.faber04.com/demos/googleOneTap/)**

---

## ✨ Features

- **Framework-agnostic** — works with vanilla JS, or any framework (React, Vue, Angular, Lit, …).
- **Zero runtime dependencies** — pure TypeScript with built-in JWT decoding.
- **Fully typed** — ships ambient type declarations for the Google Identity Services SDK; no `@types/*` packages needed.
- **Dynamic script loading** — injects `accounts.google.com/gsi/client` automatically (idempotent).
- **Session persistence** — restores a previous sign-in from `sessionStorage` on init.
- **Polished demo page included** — `index.html` is a ready-to-use demo to test the integration immediately.

---

## 📁 Project structure

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

---

## ⚡ Quick start

### 1. Install

```bash
git clone https://github.com/Faber04/com.faber04.demo.googleOneTap.git
cd com.faber04.demo.googleOneTap
npm install
```

### 2. Build

```bash
npm run build        # compile google-one-tap.ts → dist/
npm run build:watch  # watch mode
npm run serve        # serve the demo locally at http://localhost:8787
```

### 3. Usage (vanilla JS, ES module)

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
    onError: ({ reason }) => {
      console.warn('One Tap skipped:', reason);
    }
  });
</script>
```

### 4. Lit (Web Components) integration

Thanks to support for direct `HTMLElement` references, integrating the module in a Lit component is trivial:

```typescript
import { LitElement, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import GoogleOneTap from './dist/google-one-tap.js';

@customElement('google-login')
export class GoogleLogin extends LitElement {
  @query('#google-container') container!: HTMLDivElement;

  firstUpdated() {
    GoogleOneTap.init({
      clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
      buttonContainerId: this.container, // direct Shadow DOM reference
      onSuccess: ({ user }) => {
        console.log('Signed in:', user.email);
      }
    });
  }

  render() {
    return html`<div id="google-container"></div>`;
  }
}
```

---

## ⚙️ Configuration

`GoogleOneTap.init()` accepts a configuration object:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `clientId` | `string` | **required** | Your OAuth 2.0 Client ID from Google Cloud Console. |
| `onSuccess` | `function` | — | Called with `{ credential, user }` on successful sign-in. |
| `onError` | `function` | — | Called with `{ reason }` when the prompt fails or is dismissed. |
| `buttonContainerId` | `string \| HTMLElement` | — | ID (`#`) or element reference for the official Google button. |
| `autoPrompt` | `boolean` | `true` | Show the One Tap prompt automatically. |
| `context` | `string` | `'signin'` | `'signin'`, `'signup'` or `'use'`. |
| `uxMode` | `string` | `'popup'` | `'popup'` or `'redirect'`. |
| `loginUri` | `string` | — | Required when `uxMode` is `'redirect'`. |
| `cancelOnTapOutside` | `boolean` | `true` | Dismiss the prompt when clicking outside it. |
| `buttonConfig` | `object` | `{}` | Extra options forwarded to `google.accounts.id.renderButton()`. |

---

## 🧰 API

- **`init(config)`** — initializes the module: loads the GIS script, renders the Sign-In button, shows the One Tap prompt (unless a session was restored).
- **`signOut(email)`** — revokes the Google session for the given email and clears the stored session.
- **`cancel()`** — programmatically dismisses the One Tap prompt.
- **`decodeJWT(token)`** — decodes a Google ID token payload (client-side only, no signature check).

### Example ID token payload

```json
{
  "sub": "109876543210987654321",
  "email": "mario.rossi@gmail.com",
  "email_verified": true,
  "name": "Mario Rossi",
  "picture": "https://lh3.googleusercontent.com/a-/AOh14G...",
  "given_name": "Mario",
  "family_name": "Rossi",
  "locale": "it",
  "iat": 1618900000,
  "exp": 1618903600
}
```

---

## 🔒 Security

> [!IMPORTANT]
> **Never trust the client-side decoded profile for authentication.**
> After a successful sign-in, always forward the `credential` (JWT) to your backend and verify it using the [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs) or any standard JWT verification library.

---

## 🔑 Getting a Google Client ID

To use this module you need a project in the Google Cloud Console:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Go to **APIs & Services > Credentials**.
4. Click **Create credentials** and choose **OAuth client ID**.
5. If it's your first time, configure the "OAuth consent screen":
   - Choose a **User Type** (usually **External**).
   - Fill in the basic app information.
   - Add the scopes `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
6. Back in **Create credentials > OAuth client ID**:
   - Select **Web application** as the application type.
   - In **Authorized JavaScript origins**, add the origins the module will be loaded from (e.g. `http://localhost:8787` for local testing).
   - > [!WARNING]
   > **Important:** enter only the root domain (e.g. `https://www.faber04.com`). **Do not** include subfolders or trailing slashes, otherwise Google returns an "Invalid origin" error.
7. Click **Create**. You'll receive your **Client ID** (format: `xxxxxxxx.apps.googleusercontent.com`).

---

## 🚀 Deploy

The demo is served from the `demos/googleOneTap/` subfolder on the web server. Upload the following files there (e.g. via FTP):

- `index.html`
- `style/style.css`
- `dist/` (after running `npm run build`)
- `config/google-config.js`

All references to `style/`, `dist/` and `config/` in `index.html` are **relative**, so the page works under any subfolder without code changes. Make sure the site's root origin (e.g. `https://www.faber04.com`) is listed among the authorized JavaScript origins in Google Cloud Console.

---

## 📚 References

- [Google Identity Services documentation](https://developers.google.com/identity/gsi/web)
- [Google One Tap Codelab](https://codelabs.developers.google.com/codelabs/google-one-tap) — official step-by-step guide

---

## 📄 License

Distributed under the MIT License.
Faber04 © 2026
