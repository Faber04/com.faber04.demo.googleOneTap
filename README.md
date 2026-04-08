# 🔐 Google One Tap — Modulo Agnostico "Drop-in"

Un modulo TypeScript leggero e indipendente dai framework per integrare **Google One Tap** e **Sign-In with Google** (Google Identity Services) in qualsiasi applicazione web, con zero dipendenze esterne.

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
├── dist/                   # File compilati (generati)
│   ├── google-one-tap.js   # Modulo ES compilato
│   └── google-one-tap.d.ts # Dichiarazioni di tipo
└── DOCS/                   # Documentazione estesa
    ├── module-reference.md # Riferimento tecnico delle API
    └── integration-guide.md# Guida all'integrazione passo dopo passo
```

---

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

### 3. Utilizzo in qualsiasi pagina HTML

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

---

## ⚙️ Configurazione

Il metodo `GoogleOneTap.init()` accetta un oggetto di configurazione:

| Opzione | Tipo | Default | Descrizione |
| :--- | :--- | :--- | :--- |
| `clientId` | `string` | **Richiesto** | Il tuo Client ID OAuth 2.0 di Google. |
| `onSuccess` | `function` | - | Callback eseguita al successo dell'autenticazione. |
| `onError` | `function` | - | Callback eseguita se il prompt fallisce o viene chiuso. |
| `buttonContainerId` | `string` | - | ID dell'elemento per renderizzare il pulsante ufficiale. |
| `autoPrompt` | `boolean` | `true` | Mostra automaticamente il popup One Tap. |
| `uxMode` | `string` | `'popup'` | `'popup'` o `'redirect'`. |

---

## 🔒 Sicurezza

> [!IMPORTANT]
> **Non fidarti mai del profilo decodificato lato client per l'autenticazione.**
> Dopo un login riuscito, invia sempre la `credential` (JWT) al tuo backend e verificala utilizzando la [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs) o una libreria di verifica JWT standard.

---

## 📖 Documentazione Correlata

- [Guida all'Integrazione](./DOCS/integration-guide.md): Passaggi dettagliati dalla configurazione della Google Cloud Console alla verifica backend.
- [Riferimento Modulo](./DOCS/module-reference.md): Analisi tecnica completa delle API di `google-one-tap.ts`.

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT.
