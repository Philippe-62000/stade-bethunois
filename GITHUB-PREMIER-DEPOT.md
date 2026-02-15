# Créer votre premier dépôt GitHub et pousser Stade Béthunois

Vous venez de créer votre compte GitHub. Suivez ces étapes pour mettre le projet en ligne.

---

## Étape 1 – Créer un nouveau dépôt sur GitHub

1. Connectez-vous sur [github.com](https://github.com).
2. En haut à droite, cliquez sur le **+** puis **New repository**.
3. Remplissez :
   - **Repository name** : `stade-bethunois` (tout en minuscules, avec un tiret).
   - **Description** (optionnel) : *Gestion des présences – club de foot*.
   - Choisissez **Public**.
   - **Ne cochez pas** "Add a README file" (le projet en a déjà un).
   - Laissez **.gitignore** et **license** sur "None".
4. Cliquez sur **Create repository**.

Vous arrivez sur une page avec des commandes. On va faire la suite **depuis votre PC**, dans le dossier du projet.

---

## Étape 2 – Ouvrir un terminal dans le dossier du projet

1. Ouvrez **PowerShell** ou **Invite de commandes** (CMD).
2. Allez dans le dossier du projet (adaptez le chemin si besoin) :

   ```bash
   cd c:\boulangerie-planning\stade-bethunois
   ```

---

## Étape 3 – Initialiser Git et pousser le code

Copiez-collez les commandes **une par une** (remplacez `VOTRE_PSEUDO_GITHUB` par votre vrai pseudo GitHub).

**Si Git n’est pas encore installé** : téléchargez [git-scm.com](https://git-scm.com) et installez-le, puis rouvrez le terminal.

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit - Stade Béthunois"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/VOTRE_PSEUDO_GITHUB/stade-bethunois.git
```
*(remplacez VOTRE_PSEUDO_GITHUB par votre pseudo)*

```bash
git push -u origin main
```

À la première utilisation de `git push`, une fenêtre ou le terminal peut vous demander de vous **connecter à GitHub** (navigateur ou identifiants). Suivez les instructions.

---

## Étape 4 – Vérifier

1. Rafraîchissez la page de votre dépôt sur GitHub.
2. Vous devez voir tous les fichiers du projet (dossier `app`, `lib`, `package.json`, etc.).
3. **Important** : le fichier `.env.local` ne doit **pas** apparaître (il est ignoré par Git pour la sécurité).

---

## En cas de message d’erreur

- **"git is not recognized"** → Installez Git depuis [git-scm.com](https://git-scm.com) et rouvrez le terminal.
- **"remote origin already exists"** → Vous avez peut-être déjà fait `git remote add`. Utilisez :  
  `git remote set-url origin https://github.com/VOTRE_PSEUDO_GITHUB/stade-bethunois.git`
- **Authentification refusée** → Sur GitHub, allez dans **Settings** → **Developer settings** → **Personal access tokens** et créez un token avec la permission `repo`, puis utilisez ce token comme mot de passe quand Git le demande.

Une fois le code sur GitHub, vous pouvez passer à **Vercel** (voir **DEPLOIEMENT-ETAPES.md**, PARTIE 2 à partir de l’étape 2.2).
