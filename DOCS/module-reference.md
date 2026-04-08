# GoogleOneTap — Module Reference (AI-Reusable)

> Documento tecnico pensato per essere letto da una AI in sessioni future.  
> Contiene tutto ciò che serve per integrare, estendere o rigenerare il modulo.

---

## 1. Overview

`google-one-tap.js` è un modulo **vanilla JavaScript** (nessuna dipendenza) che espone un'API semplice per implementare il flusso **Google One Tap / Sign-In with Google** (Google Identity Services — GIS) in qualsiasi pagina HTML, indipendentemente dal framework usato nel progetto ospite.

### Caratteristiche

| Feature | Dettaglio |
|---|---|
| Dipendenze | Nessuna (carica il GIS script dinamicamente) |
| Esposizione | `window.GoogleOneTap` (UMD-like, compatibile anche con CommonJS) |
| JWT decode | Integrato — nessuna libreria esterna |
| Framework | Agnostico — funziona in HTML puro, React, Vue, Angular, Next.js, ecc. |
| Versione GIS | `https://accounts.google.com/gsi/client` (stabile, 2024) |

---

## 2. File Structure

```
project-root/
├── google-one-tap.js   ← modulo principale (questo file)
├── index.html          ← demo interattiva
└── DOCS/
    ├── module-reference.md   ← questo file (riferimento AI)
    └── integration-guide.md  ← guida per sviluppatori umani
```

---

## 3. API pubblica

### `GoogleOneTap.init(config)`

Carica il GIS script (se non già presente), inizializza `google.accounts.id` e mostra il prompt One Tap e/o il pulsante di Sign-In.

#### Parametri `config`

| Parametro | Tipo | Default | Descrizione |
|---|---|---|---|
| `clientId` | `string` | **Required** | OAuth 2.0 Client ID da Google Cloud Console |
| `onSuccess` | `function` | `undefined` | Callback `({ credential, user }) => void` chiamata al login riuscito |
| `onError` | `function` | `undefined` | Callback `({ reason }) => void` chiamata se il prompt non viene mostrato |
| `buttonContainerId` | `string` | `undefined` | ID dell'elemento DOM dove renderizzare il pulsante Google ufficiale |
| `autoPrompt` | `boolean` | `true` | Se `true`, mostra il popup One Tap automaticamente |
| `context` | `string` | `'signin'` | Contesto UX: `'signin'` \| `'signup'` \| `'use'` |
| `uxMode` | `string` | `'popup'` | Modalità UX: `'popup'` \| `'redirect'` |
| `loginUri` | `string` | `undefined` | URL di redirect (obbligatorio se `uxMode='redirect'`) |
| `cancelOnTapOutside` | `boolean` | `true` | Chiude il prompt se l'utente clicca fuori |
| `buttonConfig` | `object` | `{}` | Opzioni extra passate a `google.accounts.id.renderButton()` |

#### Struttura dell'oggetto `user` in `onSuccess`

```js
{
  credential: "eyJhbGciOiJSUzI1...",  // JWT grezzo — inviare al backend per verifica
  user: {
    id: "109876543210987654321",       // Google account ID (sub)
    email: "utente@gmail.com",
    name: "Mario Rossi",
    givenName: "Mario",
    familyName: "Rossi",
    picture: "https://lh3.googleusercontent.com/...",
    emailVerified: true
  }
}
```

> ⚠️ **Sicurezza**: il client riceve il JWT ma **non deve fidarsi del payload lato client**.  
> Il backend deve verificare il token via `https://oauth2.googleapis.com/tokeninfo?id_token=TOKEN`  
> oppure con la Google API Client Library.

---

### `GoogleOneTap.signOut(email)`

Revoca il token Google e disconnette l'utente.

```js
GoogleOneTap.signOut('utente@gmail.com');
```

---

### `GoogleOneTap.cancel()`

Nasconde il prompt One Tap programmaticamente.

```js
GoogleOneTap.cancel();
```

---

### `GoogleOneTap.decodeJWT(token)`

Decodifica un JWT senza verifica della firma (solo client-side, per display).

```js
const payload = GoogleOneTap.decodeJWT(credential);
// => { sub, email, name, picture, ... }
```

---

## 4. Internals — Come funziona

```
GoogleOneTap.init(config)
  │
  ├─ loadGISScript()          → inserisce <script src="...gsi/client"> nel <head>
  │                              (idempotente: non aggiunge duplicati)
  │
  ├─ google.accounts.id.initialize({ client_id, callback, ... })
  │
  ├─ google.accounts.id.renderButton(container, buttonConfig)   ← se buttonContainerId
  │
  └─ google.accounts.id.prompt(notification => ...)             ← se autoPrompt
       │
       └─ defaultCredentialHandler(response)
            └─ decodeJWT(response.credential)
            └─ config.onSuccess({ credential, user })
```

---

## 5. Prerequisiti Google Cloud

Per usare il modulo con un `clientId` reale occorre:

1. Un progetto su [Google Cloud Console](https://console.cloud.google.com/)
2. API **"Identity Services"** abilitata
3. Credenziale OAuth 2.0 di tipo **"Web application"**
4. **Origini JavaScript autorizzate**: aggiungere il dominio del sito (es. `http://localhost:3000`, `https://miosito.com`)
5. **Non** serve un redirect URI se si usa `uxMode: 'popup'`

---

## 6. Snippet minimale (copia-incolla)

```html
<div id="g-btn"></div>
<script src="google-one-tap.js"></script>
<script>
  GoogleOneTap.init({
    clientId: 'TUOCLIENTID.apps.googleusercontent.com',
    buttonContainerId: 'g-btn',
    onSuccess: ({ user }) => {
      console.log('Utente autenticato:', user.email);
      // → invia user.credential al tuo backend per la verifica
    },
  });
</script>
```

---

## 7. Pattern di verifica backend (Node.js)

```js
// npm install google-auth-library
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload; // { sub, email, name, picture, ... }
}
```

---

## 8. Limitazioni note

| Limitazione | Dettaglio |
|---|---|
| `localhost` | Funziona solo su porte standard (80/443) o porte esplicitamente aggiunte in Cloud Console |
| `file://` | **Non funziona** — deve girare su un server HTTP |
| Iframe cross-origin | One Tap non si mostra all'interno di iframe cross-origin |
| Cooldown | Google impone un cooldown del prompt se l'utente lo chiude ripetutamente (esponential backoff) |
| `uxMode: 'redirect'` | Richiede `loginUri` e configurazione backend per ricevere la POST con il credential |

---

## 9. Estensioni suggerite

- **Persistenza sessione**: salvare `user` in `localStorage` o `sessionStorage` dopo `onSuccess`
- **Token refresh**: GIS non espone refresh token in One Tap — usare OAuth Authorization Code Flow per sessioni lunghe
- **React hook**: wrappare `GoogleOneTap.init()` in un `useEffect`
- **Vue plugin**: esporre come `app.use(GoogleOneTapPlugin, { clientId })`
