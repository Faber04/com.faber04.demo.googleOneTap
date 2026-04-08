# 🔐 Google One Tap — Modulo Agnostico "Drop-in"

Un modulo TypeScript leggero e indipendente dai framework per integrare **Google One Tap** e **Sign-In with Google** (Google Identity Services) in qualsiasi applicazione web, con zero dipendenze esterne.

🚀 **[Vedi la Demo Live](https://www.faber04.com/demos/google1tap/)**

---

## 🚀 Caratteristiche Principali

- **Agnostico**: Funziona ovunque. Nessuna dipendenza da React, Vue o Angular.
- **Zero Dipendenze**: Puro TypeScript/JavaScript con decodifica JWT integrata.
- **Completamente Tipizzato**: Definizioni TypeScript complete per l'SDK di Google Identity Services.
- **Caricamento Dinamico**: Gestisce automaticamente l'iniezione dello script di Google.
- **Demo Premium inclusa**: Include una pagina demo moderna e curata per testare l'integrazione immediatamente.

---

## 🛠 Struttura del Progetto

```text
test/
├── google-one-tap.ts       # Sorgente principale del modulo
├── index.html              # Demo interattiva e moderna
├── tsconfig.json           # Configurazione TypeScript
├── package.json            # Script di build e dipendenze di sviluppo
├── .gitignore              # Regole per Git
└── dist/                   # File compilati (generati)
    ├── google-one-tap.js   # Modulo ES compilato
    └── google-one-tap.d.ts # Dichiarazioni di tipo
```

## ⚡️ Guida Rapida

### 1. Installazione

Clona il repository e installa le dipendenze di sviluppo (TypeScript):

```bash
git clone https://github.com/fabiobernardi/com.faber04.googleOneTap.git
cd com.faber04.googleOneTap
npm install
```

### 2. Compilazione

Compila il sorgente TypeScript nella cartella `dist/`:

```bash
npm run build
```

### 3. Utilizzo Base (Vanilla JS)

```html
<div id="google-btn"></div>

<!-- Carica come Modulo ES -->
<script type="module">
  import GoogleOneTap from './dist/google-one-tap.js';

  GoogleOneTap.init({
    clientId: 'IL_TUO_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    buttonContainerId: 'google-btn',
    onSuccess: ({ user, credential }) => {
      console.log('Benvenuto, ' + user.name);
      // Invia la credenziale (JWT) al tuo backend per la verifica
    },
    onError: ({ reason }) => {
      console.warn('One Tap ignorato:', reason);
    }
  });
</script>
```

### 4. Integrazione con Lit (Web Components)

Grazie al supporto per riferimenti diretti a `HTMLElement`, integrare il modulo in un componente Lit è semplicissimo:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import GoogleOneTap from './google-one-tap.js';

@customElement('google-login')
export class GoogleLogin extends LitElement {
  @query('#google-container') container!: HTMLDivElement;

  firstUpdated() {
    GoogleOneTap.init({
      clientId: 'TUO_CLIENT_ID.apps.googleusercontent.com',
      buttonContainerId: this.container, // Riferimento diretto all'elemento nel Shadow DOM
      onSuccess: ({ user }) => {
        console.log('Login riuscito:', user.email);
      }
    });
  }

  render() {
    return html`<div id="google-container"></div>`;
  }
}
```

### 5. Gestione Credenziali (Payload JWT)

Dopo un login riuscito, il modulo restituisce l'oggetto `user` decodificato. Ecco come appare tipicamente il payload di un ID Token restituito da Google:

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
---

## 🔑 Come ottenere un Client ID Google

Per utilizzare questo modulo, è necessario configurare un progetto nella Google Cloud Console:

1.  Vai alla [Google Cloud Console](https://console.cloud.google.com/).
2.  Crea un nuovo progetto o selezionane uno esistente.
3.  Vai a **API e servizi** > **Credenziali**.
4.  Fai clic su **Crea credenziali** e seleziona **ID client OAuth**.
5.  Se è la prima volta, dovrai configurare la "Schermata di consenso OAuth":
    *   Scegli un "User Type" (solitamente **Esterno**).
    *   Inserisci le informazioni di base dell'app.
    *   Aggiungi l'ambito `.../auth/userinfo.email` e `.../auth/userinfo.profile`.
6.  Torna a **Crea credenziali** > **ID client OAuth**:
    *   Seleziona **Applicazione Web** come tipo di applicazione.
    *   In **Origini JavaScript autorizzate**, aggiungi gli URL da cui caricherai il modulo (es. `http://localhost:8787` per i test locali).
    *   > [!WARNING]
    *   > **Importante**: Inserisci solo il dominio radice (es. `https://www.faber04.com`). **Non** includere sottocartelle o barre finali, altrimenti Google restituirà l'errore "Origine non valida".
7.  Fai clic su **Crea**. Riceverai il tuo **Client ID** (formato: `xxxxxxxx.apps.googleusercontent.com`).


## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT.
