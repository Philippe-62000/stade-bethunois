# Configurer EmailJS pour Stade Béthunois

Ce guide explique comment configurer EmailJS pour les emails de **création d’événement** et les **rappels** (non-réponse).

---

## Étape 1 – Créer un compte EmailJS

1. Allez sur **[emailjs.com](https://www.emailjs.com/)**.
2. Cliquez sur **Sign Up** et créez un compte (email + mot de passe).
3. Connectez-vous.

---

## Étape 2 – Créer un service email

Un "service" = la connexion entre EmailJS et votre boîte mail (Gmail, Outlook, etc.) pour **envoyer** les emails.

1. Dans le tableau de bord EmailJS : **Email Services** → **Add New Service**.
2. Choisissez un **type** :
   - **Gmail** : vous utilisez un compte Gmail pour envoyer (il faudra un "App Password" si 2FA activée).
   - **Outlook** : idem avec un compte Outlook.
3. Donnez un **nom** au service (ex. "Stade Béthunois").
4. Connectez votre compte (Gmail / Outlook) selon les instructions.
5. Une fois créé, notez le **Service ID** (ex. `service_abc123`). Vous en aurez besoin pour `.env.local` et Vercel.

---

## Étape 3 – Créer le template "Création d’événement"

Ce template est utilisé quand un éducateur crée un événement ciblé pour certains joueurs.

1. Menu **Email Templates** → **Create New Template**.
2. **Name** : par ex. "Stade Béthunois - Création événement".
3. **Subject** (objet de l’email), par ex. :
   ```
   Nouvel événement pour {{child_name}}
   ```
4. **Content** (corps du message). Vous pouvez utiliser du HTML. Exemple :

   ```html
   <p>Bonjour {{parent_name}},</p>
   <p>Un nouvel événement a été créé pour <strong>{{child_name}}</strong> :</p>
   <ul>
     <li><strong>Type :</strong> {{event_type}}</li>
     <li><strong>Date :</strong> {{event_date}}</li>
     <li><strong>Heure :</strong> {{event_time}}</li>
     <li><strong>Lieu :</strong> {{event_location}}</li>
   </ul>
   <p>Merci de confirmer la présence en cliquant sur le lien ci-dessous :</p>
   <p><a href="{{link}}">{{link}}</a></p>
   <p>Cordialement,<br>Stade Béthunois</p>
   ```

5. Les **variables** que l’application envoie (à utiliser avec `{{...}}`) sont :
   - `{{parent_name}}` – Nom du parent
   - `{{child_name}}` – Nom de l’enfant
   - `{{event_type}}` – Entraînement / Match / Tournoi
   - `{{event_date}}` – Date (ex. 15/02/2026)
   - `{{event_time}}` – Heure (ex. 18:00)
   - `{{event_location}}` – Lieu
   - `{{link}}` – Lien vers le site (calendrier)

6. **Save** le template.
7. Notez le **Template ID** (ex. `template_xyz789`) → ce sera **EMAILJS_TEMPLATE_ID_CREATION**.

---

## Étape 4 – Créer le template "Rappel" (non-réponse)

Utilisé pour les rappels envoyés 2 jours avant l’événement si le parent n’a pas répondu.

1. **Email Templates** → **Create New Template**.
2. **Name** : par ex. "Stade Béthunois - Rappel".
3. **Subject** :
   ```
   Rappel : réponse attendue pour {{event_date}}
   ```
4. **Content** (exemple) :

   ```html
   <p>Bonjour {{parent_name}},</p>
   <p>Vous n'avez pas encore répondu concernant la présence de <strong>{{child_name}}</strong> à l'événement suivant :</p>
   <ul>
     <li><strong>Type :</strong> {{event_type}}</li>
     <li><strong>Date :</strong> {{event_date}}</li>
     <li><strong>Heure :</strong> {{event_time}}</li>
     <li><strong>Lieu :</strong> {{event_location}}</li>
   </ul>
   <p>Merci de confirmer la présence en cliquant sur le lien ci-dessous :</p>
   <p><a href="{{link}}">{{link}}</a></p>
   <p>Cordialement,<br>Stade Béthunois</p>
   ```

5. Mêmes variables : `{{parent_name}}`, `{{child_name}}`, `{{event_type}}`, `{{event_date}}`, `{{event_time}}`, `{{event_location}}`, `{{link}}`.
6. **Save**.
7. Notez le **Template ID** de ce template → ce sera **EMAILJS_TEMPLATE_ID_REMINDER**.

---

## Étape 5 – Récupérer la clé publique (Public Key)

1. Dans EmailJS : **Account** (ou clic sur votre email) → **API Keys** (ou "General").
2. Vous voyez **Public Key** (ex. `AbCdEfGh123456`).
3. Notez-la → ce sera **EMAILJS_PUBLIC_KEY**.

*(La "Private Key" ne sert pas pour notre utilisation.)*

---

## Étape 6 – Mettre les valeurs dans le projet

### En local (`.env.local`)

Ouvrez `stade-bethunois/.env.local` et remplissez :

```env
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID_CREATION=template_xxxxx
EMAILJS_TEMPLATE_ID_REMINDER=template_yyyyy
EMAILJS_PUBLIC_KEY=VotrePublicKeyIci
```

Remplacez par les vraies valeurs notées aux étapes 2, 3, 4 et 5.

### Sur Vercel

1. Projet Vercel → **Settings** → **Environment Variables**.
2. Ajoutez les **4 variables** avec les mêmes noms et les mêmes valeurs.

---

## Récapitulatif des 4 variables

| Variable | Où la trouver dans EmailJS |
|----------|----------------------------|
| **EMAILJS_SERVICE_ID** | Email Services → votre service → Service ID |
| **EMAILJS_TEMPLATE_ID_CREATION** | Email Templates → template "Création événement" → Template ID |
| **EMAILJS_TEMPLATE_ID_REMINDER** | Email Templates → template "Rappel" → Template ID |
| **EMAILJS_PUBLIC_KEY** | Account → API Keys → Public Key |

---

## Limite gratuite EmailJS

En gratuit, EmailJS limite le nombre d’emails par mois (souvent 200). Pour un petit club (40 enfants, quelques événements par semaine), c’est en général suffisant. Si vous dépassez, il faudra passer à un plan payant.

---

## Test

Après configuration, vous pouvez tester en :

1. Déployant sur Vercel (ou en lançant l’app en local).
2. Créant un **événement** avec une **sélection ciblée** de joueurs : un email "Création" doit être envoyé au(x) parent(s) concerné(s).
3. Ne pas répondre à un événement et attendre le jour du **rappel** (ou déclencher manuellement l’URL cron) : un email "Rappel" doit partir.

Si les emails ne partent pas, vérifiez les 4 variables et les logs (Vercel → Logs, ou console en local).
