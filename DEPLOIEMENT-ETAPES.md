# Mise en ligne du site Stade Béthunois – étape par étape

Ce guide décrit comment mettre en ligne l’application **Stade Béthunois** (Next.js + MongoDB + EmailJS).

**Vous avez choisi Vercel** – suivez le **Guide rapide Vercel** ci‑dessous, puis la **PARTIE 1** (préparation) et la **PARTIE 2** (Vercel).

---

## Guide rapide Vercel (checklist)

| # | Étape | Fait |
|---|--------|------|
| 1 | Avoir MongoDB + EmailJS configurés, et un compte GitHub | ☐ |
| 2 | Préparer le projet : `.env.local` + `npm run build` (voir PARTIE 1) | ☐ |
| 3 | Pousser le code sur GitHub (dépôt `stade-bethunois`) | ☐ |
| 4 | Créer un projet sur [vercel.com](https://vercel.com) relié à ce dépôt | ☐ |
| 5 | Ajouter toutes les variables d’environnement dans Vercel | ☐ |
| 6 | Déployer, noter l’URL (ex. `https://stade-bethunois-xxx.vercel.app`) | ☐ |
| 7 | Mettre `NEXTAUTH_URL` à cette URL dans Vercel, puis redéployer | ☐ |
| 8 | Configurer le cron des rappels sur [cron-job.org](https://cron-job.org) | ☐ |
| 9 | (Optionnel) Ajouter un domaine personnalisé dans Vercel + DNS | ☐ |

---

## Étape 0 : Ce qu’il faut avoir avant de commencer

- [ ] Un **compte MongoDB** (Atlas ou serveur MongoDB) et une **URI de connexion**
- [ ] Un **compte EmailJS** avec un service et 2 templates (création + rappel)
- [ ] Un **compte GitHub** (gratuit)
- [ ] Un **compte Vercel** (gratuit) – [vercel.com](https://vercel.com), connexion avec GitHub
- [ ] (Optionnel) Un **domaine** pour remplacer `xxx.vercel.app`

---

## PARTIE 1 : Préparer le projet en local

### Étape 1.1 – Variables d’environnement

1. Dans le dossier du projet, copiez le fichier d’exemple :
   ```
   copier .env.local.example vers .env.local
   ```
2. Ouvrez **`.env.local`** et remplissez **toutes** les variables :

```env
# Obligatoire
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/stade-bethunois
JWT_SECRET=une_longue_phrase_secrete_aleatoire_32_caracteres_minimum
CRON_SECRET=une_autre_phrase_secrete_pour_le_cron

# EmailJS (depuis le dashboard EmailJS)
EMAILJS_SERVICE_ID=votre_service_id
EMAILJS_TEMPLATE_ID_CREATION=template_id_creation
EMAILJS_TEMPLATE_ID_REMINDER=template_id_rappel
EMAILJS_PUBLIC_KEY=votre_public_key

# Rappels (optionnel, valeurs par défaut ci-dessous)
REMINDER_HOUR=8
REMINDER_DAYS_BEFORE=2

# URL du site en production (à adapter après mise en ligne)
NEXTAUTH_URL=https://votre-domaine.fr
```

3. **Ne jamais** commiter `.env.local` dans Git (il est normalement dans `.gitignore`).

### Étape 1.2 – Vérifier le build en local

Dans le dossier du projet :

```bash
cd stade-bethunois
npm install
npm run build
```

- Si `npm run build` se termine **sans erreur**, le projet est prêt pour le déploiement.
- En cas d’erreur, corriger d’abord (TypeScript, imports, etc.) avant de continuer.

---

## PARTIE 2 – Mise en ligne sur Vercel

Pas de serveur à gérer : déploiement depuis GitHub, HTTPS inclus.

### Étape 2.1 – Pousser le projet sur GitHub

1. Créez un dépôt sur [GitHub](https://github.com) (ex. `stade-bethunois`), **sans** initialiser avec un README si le projet existe déjà en local.
2. Dans le dossier du projet (PowerShell ou CMD) :

   ```bash
   cd stade-bethunois
   git init
   git add .
   git commit -m "Initial commit - Stade Béthunois"
   git branch -M main
   git remote add origin https://github.com/VOTRE_UTILISATEUR/stade-bethunois.git
   git push -u origin main
   ```

   Remplacez `VOTRE_UTILISATEUR` par votre nom d’utilisateur GitHub.

### Étape 2.2 – Créer le projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous avec **GitHub**.
2. **Add New** → **Project**.
3. Choisissez le dépôt **stade-bethunois** (s’il n’apparaît pas, autorisez Vercel à accéder à vos dépôts GitHub).
4. Framework : **Next.js** (détecté automatiquement).
5. **Root Directory** : laisser vide (projet à la racine).
6. Ne cliquez pas encore sur Deploy : on ajoute d’abord les variables d’environnement.

### Étape 2.3 – Variables d’environnement sur Vercel

Dans la même page (ou **Settings** → **Environment Variables** après création du projet), ajoutez **chaque** variable :

| Nom | Valeur | Obligatoire |
|-----|--------|--------------|
| `MONGODB_URI` | Votre URI MongoDB | Oui |
| `JWT_SECRET` | Une longue phrase secrète (32+ caractères) | Oui |
| `CRON_SECRET` | Une autre phrase secrète (pour le cron des rappels) | Oui |
| `EMAILJS_SERVICE_ID` | ID du service EmailJS | Oui |
| `EMAILJS_TEMPLATE_ID_CREATION` | ID du template « création d’événement » | Oui |
| `EMAILJS_TEMPLATE_ID_REMINDER` | ID du template « rappel » | Oui |
| `EMAILJS_PUBLIC_KEY` | Clé publique EmailJS | Oui |
| `REMINDER_HOUR` | `8` (heure d’envoi des rappels) | Optionnel |
| `REMINDER_DAYS_BEFORE` | `2` (jours avant l’événement) | Optionnel |
| `NEXTAUTH_URL` | À remplir **après** le 1er déploiement : `https://votre-url.vercel.app` | Oui (après 1er déploiement) |

Pour `NEXTAUTH_URL` : laissez vide au premier déploiement, puis après le déploiement mettez l’URL fournie par Vercel (ex. `https://stade-bethunois-xxx.vercel.app`).

### Étape 2.4 – Premier déploiement

1. Cliquez sur **Deploy**.
2. Attendez la fin du build (1 à 3 minutes).
3. Vercel affiche une URL du type : `https://stade-bethunois-xxxxx.vercel.app`.
4. Ouvrez cette URL : la page d’accueil Stade Béthunois doit s’afficher.
5. Allez dans **Settings** → **Environment Variables**, éditez `NEXTAUTH_URL` et mettez exactement cette URL (ex. `https://stade-bethunois-xxxxx.vercel.app`).
6. **Redéployez** : **Deployments** → menu **⋯** sur le dernier déploiement → **Redeploy**.

### Étape 2.5 – Domaine personnalisé (optionnel)

1. Dans le projet Vercel : **Settings** → **Domains**.
2. Ajoutez votre domaine (ex. `stadebethunois.fr` ou `club.mondomaine.fr`).
3. Vercel indique les enregistrements DNS à créer (souvent **CNAME** vers `cname.vercel-dns.com`).
4. Dans OVH (ou votre registrar) : **Zone DNS** → ajoutez l’enregistrement indiqué par Vercel.
5. Une fois le domaine actif (quelques minutes à quelques heures), mettez `NEXTAUTH_URL` à cette URL (ex. `https://stadebethunois.fr`) et redéployez.

### Étape 2.6 – Cron pour les rappels (obligatoire pour les rappels email)

Sur le plan gratuit, Vercel ne lance pas de tâches planifiées. Utilisez un service externe :

1. Allez sur [cron-job.org](https://cron-job.org) (gratuit) et créez un compte.
2. **Cron Jobs** → **Create Cron Job**.
3. **URL** :  
   `https://VOTRE-URL.vercel.app/api/cron/send-reminders?secret=VOTRE_CRON_SECRET`  
   (remplacez par votre URL Vercel et la valeur de `CRON_SECRET`).
4. **Méthode** : GET.
5. **Planification** : tous les jours à 8h (ex. `0 8 * * *` ou choix « Daily » à 08:00).
6. Enregistrez.

---

## PARTIE 3 – Alternative : Mise en ligne sur un VPS OVH

Si vous préférez tout héberger sur un VPS OVH (serveur toujours actif, pas de cold start).

### Étape 3.1 – Connexion au VPS

1. Ouvrez un terminal (PowerShell ou client SSH).
2. Connectez-vous avec l’utilisateur fourni par OVH (souvent `root` ou un utilisateur créé) :
   ```bash
   ssh utilisateur@ip_du_vps
   ```
3. Mettez à jour le système (recommandé) :
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Étape 3.2 – Installer Node.js (LTS)

Sur le VPS :

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Vous devez voir une version 20.x pour Node.

### Étape 3.3 – Installer PM2 (pour faire tourner l’app en arrière-plan)

```bash
sudo npm install -g pm2
```

### Étape 3.4 – Envoyer le projet sur le VPS

**Méthode 1 – Git (recommandé si le projet est sur GitHub/GitLab)**  
Sur le VPS :

```bash
cd /var/www
sudo mkdir -p stade-bethunois
sudo chown $USER:$USER stade-bethunois
cd stade-bethunois
git clone https://github.com/VOTRE_UTILISATEUR/stade-bethunois.git .
```

**Méthode 2 – Copie avec SCP (depuis votre PC Windows)**  
Depuis votre machine, dans le dossier parent de `stade-bethunois` :

```bash
scp -r stade-bethunois utilisateur@ip_du_vps:/var/www/
```

(Remplacez `utilisateur` et `ip_du_vps`.)

### Étape 3.5 – Configurer et lancer l’app sur le VPS

1. Sur le VPS, aller dans le dossier du projet :
   ```bash
   cd /var/www/stade-bethunois
   ```
2. Créer le fichier `.env.local` **sur le serveur** (même contenu que en local, avec `NEXTAUTH_URL` pointant vers votre domaine) :
   ```bash
   nano .env.local
   ```
   Collez vos variables, sauvegardez (Ctrl+O, Entrée, Ctrl+X).
3. Installer les dépendances et build :
   ```bash
   npm install
   npm run build
   ```
4. Démarrer avec PM2 :
   ```bash
   pm2 start npm --name "stade-bethunois" -- start
   pm2 save
   pm2 startup
   ```
5. Vérifier :
   ```bash
   pm2 status
   pm2 logs stade-bethunois
   ```

L’app tourne en local sur le VPS (port 3000 par défaut).

### Étape 3.6 – Installer Nginx (reverse proxy + HTTPS)

1. Installer Nginx :
   ```bash
   sudo apt install -y nginx
   ```
2. Créer un fichier de configuration pour votre domaine :
   ```bash
   sudo nano /etc/nginx/sites-available/stade-bethunois
   ```
   Contenu (à adapter `votre-domaine.fr` et `stade-bethunois`) :

   ```nginx
   server {
       listen 80;
       server_name votre-domaine.fr www.votre-domaine.fr;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Activer le site et recharger Nginx :
   ```bash
   sudo ln -s /etc/nginx/sites-available/stade-bethunois /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **HTTPS avec Let’s Encrypt** (recommandé) :
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d votre-domaine.fr -d www.votre-domaine.fr
   ```
   Suivez les instructions. Certbot met à jour Nginx pour le HTTPS.

### Étape 3.7 – DNS (domaine)

Dans l’espace client OVH (ou votre bureau d’enregistrement) :

1. Aller dans **Domaines** → votre domaine → **Zone DNS**.
2. Ajouter ou modifier un enregistrement **A** :
   - Sous-domaine : `@` (ou `www` si vous voulez www.votre-domaine.fr)
   - Cible : **IP de votre VPS**
   - TTL : 300 ou 3600

Attendre 5 à 60 minutes, puis tester : `https://votre-domaine.fr`.

### Étape 3.8 – Cron pour les rappels (VPS)

Sur le VPS, éditer le crontab :

```bash
crontab -e
```

Ajouter une ligne (rappels tous les jours à 8h) :

```cron
0 8 * * * curl -s "https://votre-domaine.fr/api/cron/send-reminders?secret=VOTRE_CRON_SECRET"
```

Remplacez `VOTRE_CRON_SECRET` par la valeur de `CRON_SECRET` dans `.env.local`. Sauvegardez.

---

## PARTIE 4 – Après la mise en ligne

### 4.1 – Vérifications

- [ ] La page d’accueil s’affiche.
- [ ] Inscription / Connexion fonctionnent.
- [ ] Un éducateur ou admin peut créer une équipe et un événement.
- [ ] Un parent peut voir le calendrier et déclarer une présence.
- [ ] Les emails EmailJS partent (création d’événement ciblé, puis rappel si configuré).

### 4.2 – Premier utilisateur admin

Si vous n’avez pas encore de compte **admin**, créez-le via la page **Inscription** en choisissant le rôle **Administrateur**, ou modifiez en base un utilisateur existant pour lui mettre le rôle `admin`.

### 4.3 – Sécurité

- Utilisez des mots de passe forts pour `JWT_SECRET` et `CRON_SECRET`.
- Ne partagez jamais `.env.local` ni les variables d’environnement.
- En production, gardez toujours **HTTPS** (Vercel le fait par défaut ; sur VPS, utilisez Certbot comme en 2.6).

---

## Récapitulatif des URLs utiles

| Élément | Où le trouver / configurer |
|--------|-----------------------------|
| MongoDB | Atlas ou votre serveur → URI dans `MONGODB_URI` |
| EmailJS | Dashboard EmailJS → Service + 2 templates + Public Key |
| Domaine | OVH / registrar → Zone DNS → A ou CNAME vers VPS ou Vercel |
| Cron | VPS : `crontab -e` / Externe : cron-job.org avec l’URL `/api/cron/send-reminders` |

---

## En cas de problème

- **Build échoue** : vérifier les erreurs dans le terminal ou dans l’onglet **Build** Vercel ; souvent un import ou une variable d’env manquante.
- **Erreur 502 / site inaccessible** : sur VPS, vérifier que l’app tourne (`pm2 status`) et que Nginx pointe bien vers le bon port (3000).
- **Connexion MongoDB refusée** : vérifier l’URI et, sur MongoDB Atlas, autoriser l’accès depuis n’importe quelle IP (`0.0.0.0/0`) ou ajouter les IP de Vercel si besoin.
- **Emails non reçus** : vérifier les templates EmailJS, les variables d’env, et les logs (**Vercel** : onglet Logs du projet).
