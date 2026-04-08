# Google One Tap — Guida all'Integrazione

> Cosa è stato fatto, cosa serve e come integrarlo nel tuo progetto.

---

## Cosa abbiamo costruito

Questo progetto è una **demo autonoma e agnostica** di Google One Tap (Sign-In with Google).  
È composta da soli **2 file operativi**:

| File | Ruolo |
|---|---|
| `google-one-tap.js` | Modulo drop-in riutilizzabile — nessuna dipendenza |
| `index.html` | Pagina demo interattiva (utile per testare e capire il flusso) |

---

## Perché "agnostico"?

Il modulo **non dipende da alcun framework**. Funziona allo stesso modo in:

- Pagine HTML statiche
- Applicazioni React / Next.js
- Applicazioni Vue / Nuxt
- Applicazioni Angular
- CMS (WordPress, Webflow, ecc.) — basta includere lo `<script>`

L'unica cosa che il progetto ospite deve fare è **includere `google-one-tap.js`** e chiamare `GoogleOneTap.init()`.

---

## Cosa serve prima di iniziare

### 1. Un Google Cloud Project con OAuth configurato

1. Vai su [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Crea un nuovo progetto (o usa uno esistente)
3. Menu → **API e servizi** → **Credenziali**
4. Clicca **Crea credenziali** → **ID client OAuth 2.0**
5. Tipo applicazione: **Applicazione web**
6. Aggiungi in **"Origini JavaScript autorizzate"**:
   - `http://localhost` (o la porta del tuo dev server, es. `http://localhost:3000`)
   - `https://tuodominio.com` (per produzione)
7. Clicca **Crea** e copia il **Client ID** (formato: `XXXXXXXXXX.apps.googleusercontent.com`)

> ⚠️ **Importante**: il Client ID è pubblico e va nel codice frontend.  
> Il **Client Secret** NON va mai nel frontend — serve solo lato server.

### 2. Un server HTTP locale (per lo sviluppo)

One Tap **non funziona** su `file://`. Devi servire i file tramite HTTP.

Esempi di server rapidi:

```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code Live Server
# → installa l'estensione "Live Server" e clicca "Go Live"
```

---

## Come integrare in un progetto esistente

### HTML statico / CMS

```html
<!-- 1. Includi il modulo -->
<script src="/path/to/google-one-tap.js"></script>

<!-- 2. Aggiungi il container per il pulsante (opzionale) -->
<div id="google-signin-btn"></div>

<!-- 3. Inizializza -->
<script>
  GoogleOneTap.init({
    clientId: 'TUO_CLIENT_ID.apps.googleusercontent.com',
    buttonContainerId: 'google-signin-btn',
    onSuccess: function({ user, credential }) {
      // user.email, user.name, user.picture disponibili subito
      // credential è il JWT da inviare al backend per la verifica
      console.log('Login:', user.name, user.email);
    },
    onError: function({ reason }) {
      console.warn('One Tap non disponibile:', reason);
    }
  });
</script>
```

---

### React (hook)

```jsx
// hooks/useGoogleOneTap.js
import { useEffect } from 'react';

export function useGoogleOneTap({ clientId, onSuccess, onError }) {
  useEffect(() => {
    // Carica il modulo dinamicamente se non già presente
    const script = document.createElement('script');
    script.src = '/google-one-tap.js';
    script.onload = () => {
      window.GoogleOneTap.init({ clientId, onSuccess, onError });
    };
    document.head.appendChild(script);

    return () => {
      window.GoogleOneTap?.cancel();
    };
  }, [clientId]);
}

// Uso nel componente
function LoginPage() {
  useGoogleOneTap({
    clientId: 'TUO_CLIENT_ID.apps.googleusercontent.com',
    onSuccess: ({ user }) => console.log(user),
  });

  return <div id="google-signin-btn" />;
}
```

---

### Vue 3 (composable)

```js
// composables/useGoogleOneTap.js
import { onMounted, onUnmounted } from 'vue';

export function useGoogleOneTap(config) {
  onMounted(() => {
    window.GoogleOneTap.init(config);
  });
  onUnmounted(() => {
    window.GoogleOneTap?.cancel();
  });
}
```

---

### Next.js (App Router)

```tsx
// components/GoogleOneTapProvider.tsx
'use client';
import Script from 'next/script';

export function GoogleOneTapProvider({ clientId, onSuccess }) {
  return (
    <>
      <Script src="/google-one-tap.js" strategy="afterInteractive"
        onLoad={() => {
          window.GoogleOneTap.init({ clientId, onSuccess });
        }}
      />
      <div id="google-signin-btn" />
    </>
  );
}
```

---

## Flusso completo end-to-end

```
Browser                          Backend
  │                                │
  │  1. GoogleOneTap.init()        │
  │  2. GIS mostra il prompt       │
  │  3. Utente accetta             │
  │  4. onSuccess({ credential })  │
  │                                │
  │  POST /api/auth/google         │
  │  { token: credential }  ──────►│
  │                                │  5. Verifica JWT con Google
  │                                │     GET tokeninfo?id_token=...
  │                                │     oppure google-auth-library
  │                                │
  │◄─────────────────────────────  │  6. Restituisce sessione / cookie
  │  { sessionToken, user }        │
```

### Endpoint di verifica backend (Node.js / Express)

```js
// npm install google-auth-library
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub, email, name, picture } = ticket.getPayload();
    // → crea o aggiorna l'utente nel DB
    // → genera una sessione / JWT proprio
    res.json({ ok: true, user: { id: sub, email, name, picture } });
  } catch (err) {
    res.status(401).json({ error: 'Token non valido' });
  }
});
```

---

## Variabili d'ambiente consigliate

```env
# .env (non committare mai in git)
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx   # solo backend
```

---

## Checklist pre-deploy

- [ ] Client ID impostato correttamente (non il secret!)
- [ ] Dominio di produzione aggiunto nelle origini autorizzate su Cloud Console
- [ ] Il frontend invia `credential` (JWT) al backend e **non** usa il payload client-side per decisioni di sicurezza
- [ ] Il backend verifica il token prima di creare la sessione
- [ ] HTTPS attivo in produzione (One Tap richiede HTTPS in produzione)
- [ ] Gestito il caso `onError` (prompt bloccato da browser / adblocker)

---

## Problemi comuni

| Problema | Causa | Soluzione |
|---|---|---|
| Il prompt non appare | Dominio non autorizzato su Cloud Console | Aggiungere l'origine in Cloud Console |
| `idpiframe_initialization_failed` | File aperto con `file://` | Usare un server HTTP locale |
| Prompt scompare subito | Cooldown di Google (utente ha chiusto più volte) | Aspettare o usare solo il pulsante renderizzato |
| `invalid_client` | Client ID errato o progetto disabilitato | Verificare su Cloud Console |
| One Tap non funziona su iOS Safari | Limitazioni third-party cookies | Usare `uxMode: 'redirect'` come fallback |

---

## Riferimenti ufficiali

- [Google Identity Services — Documentazione](https://developers.google.com/identity/gsi/web/guides/overview)
- [Riferimento API `google.accounts.id`](https://developers.google.com/identity/gsi/web/reference/js-reference)
- [Verifica token ID lato server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
