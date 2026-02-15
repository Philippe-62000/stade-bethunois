# Corriger l'erreur 403 (Permission denied) sur GitHub

L’erreur vient du fait que :
- Le dépôt cible est **StadeB62** / stade-bethunois
- Git utilise le compte **Philippe-62000** (identifiants enregistrés sur le PC)
- Philippe-62000 n’a pas le droit d’écrire sur le dépôt de StadeB62

Choisissez **une** des solutions ci-dessous.

---

## Solution A – Pousser vers le compte actuellement connecté (Philippe-62000)

Si **Philippe-62000** est votre compte et que vous voulez que le projet soit sur ce compte :

1. Sur GitHub, connectez-vous avec **Philippe-62000**.
2. Créez un **nouveau** dépôt : **+** → **New repository** → nom : `stade-bethunois` → **Create repository** (sans README).
3. Dans le terminal, dans `c:\boulangerie-planning\stade-bethunois`, changez l’adresse du remote puis poussez :

```bash
git remote set-url origin https://github.com/Philippe-62000/stade-bethunois.git
git push -u origin main
```

Le code sera alors sur **Philippe-62000/stade-bethunois**. Vous pourrez connecter ce dépôt à Vercel.

---

## Solution B – Pousser vers StadeB62 (garder le dépôt actuel)

Si le dépôt doit rester **StadeB62/stade-bethunois**, il faut que Git utilise le compte **StadeB62** pour pousser.

### B1 – Vous êtes bien StadeB62

Sur votre PC, les identifiants Git sont ceux de **Philippe-62000**. Il faut pousser avec **StadeB62** :

1. Ouvrez **Gestionnaire d’identifiants Windows** (recherche Windows : “Gestionnaire d’identifiants”).
2. Onglet **Informations d’identification Windows** → **Informations d’identification génériques**.
3. Repérez une entrée du type `git:https://github.com` → **Modifier** (ou Supprimer).
4. Supprimez-la ou remplacez par le compte **StadeB62** (pseudo + mot de passe ou **Personal Access Token**).
5. Dans le terminal :

```bash
git push -u origin main
```

Quand Git demande identifiant / mot de passe, utilisez **StadeB62** et son mot de passe (ou un token).

### B2 – Utiliser un token (recommandé)

1. Connectez-vous sur GitHub avec **StadeB62**.
2. **Settings** (icône profil) → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
3. Donnez un nom (ex. “PC Philippe”), cochez **repo**, générez et **copiez le token** (il ne sera plus affiché).
4. Dans le terminal :

```bash
git push -u origin main
```

- Utilisateur : **StadeB62**
- Mot de passe : **collez le token** (pas votre mot de passe GitHub)

Ensuite vous pouvez enregistrer le token dans le Gestionnaire d’identifiants Windows pour ne pas le ressaisir.

---

## Vérifier le remote actuel

Pour voir vers quel dépôt pointe `origin` :

```bash
git remote -v
```

Pour le remplacer (Solution A) :

```bash
git remote set-url origin https://github.com/Philippe-62000/stade-bethunois.git
```

(Adaptez l’URL si le dépôt a un autre nom.)
