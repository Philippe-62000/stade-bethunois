# 🔧 Configuration EmailJS - Destinataire Vide (Erreur 422)

## ❌ Problème

Erreur lors de l'envoi d'email : **"The recipients address is empty"** (422)

## ✅ Solution : Configurer le Destinataire dans le Service EmailJS

### Étape 1 : Accéder au Service EmailJS

1. Allez sur [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
2. Cliquez sur **"Email Services"** dans le menu de gauche
3. Trouvez votre service (celui correspondant à `EMAILJS_SERVICE_ID`)
4. Cliquez sur **"Edit"** ou **"View"**

### Étape 2 : Configurer le Champ "To Email"

Dans les paramètres du service EmailJS, vous devez configurer le champ **"To Email"** :

**Option A : Utiliser une Variable Dynamique (Recommandé)**

Dans le champ **"To Email"** du service, entrez :
```
{{to_email}}
```

Cela permettra d'utiliser l'adresse email passée dans `templateParams`.

**Option B : Si le Service n'Accepte pas les Variables**

Si votre service EmailJS (ex: Gmail SMTP) ne permet pas d'utiliser `{{to_email}}` directement dans le champ "To Email", vous devez :

1. Laisser le champ "To Email" vide dans le service
2. Utiliser l'API EmailJS avec `accessToken` au lieu de `publicKey` (côté serveur uniquement)

**Pour notre cas (côté client avec `@emailjs/browser`)** : Le service DOIT accepter `{{to_email}}` dans le champ "To Email".

### Étape 3 : Vérifier le Template

Dans votre template `template_Stade_Creation` :

1. **Subject (Sujet)** : `{{subject}}`
2. **Content (Contenu)** : `{{{html_message}}}` (avec 3 accolades)
3. Le template n'a pas besoin de configurer le destinataire, c'est le service qui s'en charge

### Étape 4 : Vérifier les Variables Envoyées

Le code envoie maintenant ces variables dans `templateParams` :
- `to_email` : Adresse email du parent (utilisée par le service)
- `user_email` : Alternative (pour certains services)
- `html_message` : HTML complet du message
- `subject` : Sujet de l'email
- `parent_name`, `site_url`, `login_code` : Variables supplémentaires

## 🔍 Vérification

### Dans EmailJS Dashboard → Email Services

1. Ouvrez votre service
2. Vérifiez le champ **"To Email"**
3. Il doit contenir : `{{to_email}}`
4. **PAS** une adresse email statique comme `admin@example.com`

### Exemple de Configuration Correcte

**Service EmailJS :**
- **Service Name** : Gmail (ou votre service)
- **To Email** : `{{to_email}}` ✅
- **From Name** : `Stade Béthunois` (ou `{{from_name}}`)
- **From Email** : Votre adresse email

**Template EmailJS (`template_Stade_Creation`) :**
- **Subject** : `{{subject}}`
- **Content** : `{{{html_message}}}`

## ⚠️ Notes Importantes

1. **Le destinataire est configuré dans le SERVICE, pas dans le template**
2. **Le champ "To Email" du service doit utiliser `{{to_email}}`**
3. **Si votre service ne supporte pas les variables dynamiques**, vous devrez peut-être utiliser une approche différente (API côté serveur avec `accessToken`)

## 🧪 Test

Après avoir configuré le service :

1. ✅ Vérifiez que le champ "To Email" contient `{{to_email}}`
2. ✅ Sauvegardez le service
3. ✅ Testez l'envoi d'un code de connexion depuis l'interface admin
4. ✅ Vérifiez dans la console F12 que `to_email` est bien défini dans les logs
5. ✅ L'email devrait être envoyé correctement
