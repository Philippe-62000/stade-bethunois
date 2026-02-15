# Stade Béthunois - Gestion des présences

Application web pour gérer les présences des enfants dans un club de foot.

## Fonctionnalités

- **Authentification** avec rôles (Parent, Éducateur, Admin)
- **Gestion des équipes** et des enfants
- **Récurrence d'événements** : mensuelle ou saisonnière (septembre à juin)
- **Événements exceptionnels** : tournois, entraînements supplémentaires
- **Sélection ciblée** : demander disponibilité à certains joueurs uniquement
- **Calendrier responsive** : accessible sur mobile et desktop
- **Déclaration de disponibilité** par les parents
- **Notifications email** via EmailJS :
  - Notification immédiate lors de la création d'événements ciblés
  - Rappels automatiques (8h, 2 jours avant l'événement)
- **Paramètres de notifications** : possibilité de désactiver les rappels

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Créer le fichier `.env.local` à partir de `.env.local.example` :
```bash
cp .env.local.example .env.local
```

3. Configurer les variables d'environnement dans `.env.local` :
- `MONGODB_URI` : URI de connexion MongoDB
- `EMAILJS_SERVICE_ID` : ID du service EmailJS
- `EMAILJS_TEMPLATE_ID_CREATION` : ID du template pour les notifications de création
- `EMAILJS_TEMPLATE_ID_REMINDER` : ID du template pour les rappels
- `EMAILJS_PUBLIC_KEY` : Clé publique EmailJS
- `REMINDER_HOUR` : Heure d'envoi des rappels (défaut: 8)
- `REMINDER_DAYS_BEFORE` : Nombre de jours avant l'événement (défaut: 2)
- `CRON_SECRET` : Secret pour sécuriser l'endpoint cron
- `JWT_SECRET` : Secret pour les tokens JWT
- `NEXTAUTH_URL` : URL de l'application

## Configuration EmailJS

1. Créer un compte sur [EmailJS](https://www.emailjs.com/)
2. Créer un service email
3. Créer deux templates :
   - **Template de création** : pour les notifications lors de la création d'événements
   - **Template de rappel** : pour les rappels automatiques

Variables disponibles dans les templates :
- `{{parent_name}}` : Nom du parent
- `{{child_name}}` : Nom de l'enfant
- `{{event_type}}` : Type d'événement (Entraînement, Match, Tournoi)
- `{{event_date}}` : Date de l'événement (format: dd/MM/yyyy)
- `{{event_time}}` : Heure de l'événement
- `{{event_location}}` : Lieu de l'événement
- `{{link}}` : Lien vers le calendrier

## Configuration du cron pour les rappels

L'endpoint `/api/cron/send-reminders` doit être appelé tous les jours à l'heure configurée (par défaut 8h).

### Option 1 : Utiliser cron-job.org

1. Créer un compte sur [cron-job.org](https://cron-job.org/)
2. Créer un nouveau job :
   - URL : `https://votre-domaine.com/api/cron/send-reminders?secret=VOTRE_CRON_SECRET`
   - Méthode : GET
   - Planification : Tous les jours à 8h (ou l'heure configurée)

### Option 2 : Utiliser un VPS avec cron

Ajouter dans le crontab :
```
0 8 * * * curl "https://votre-domaine.com/api/cron/send-reminders?secret=VOTRE_CRON_SECRET"
```

## Développement

Lancer le serveur de développement :
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Production

Build de l'application :
```bash
npm run build
```

Lancer le serveur de production :
```bash
npm start
```

## Structure du projet

```
stade-bethunois/
├── app/
│   ├── api/              # Routes API
│   │   ├── auth/         # Authentification
│   │   ├── events/       # Événements
│   │   ├── children/     # Enfants
│   │   ├── teams/        # Équipes
│   │   ├── availabilities/ # Disponibilités
│   │   └── cron/         # Tâches cron
│   ├── parent/           # Pages parents
│   ├── educator/        # Pages éducateurs
│   └── login/            # Pages d'authentification
├── components/           # Composants React
├── lib/                  # Utilitaires
│   ├── mongodb.ts        # Connexion MongoDB
│   ├── auth.ts           # Authentification
│   ├── emailjs.ts        # Envoi d'emails
│   └── recurrence.ts    # Gestion de la récurrence
└── models/              # Modèles Mongoose
```

## Technologies utilisées

- **Next.js 16** : Framework React
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styles
- **MongoDB + Mongoose** : Base de données
- **EmailJS** : Envoi d'emails
- **date-fns** : Manipulation de dates
- **JWT** : Authentification

## Notes

- Les rappels sont envoyés uniquement aux parents qui n'ont pas encore répondu
- Les parents peuvent désactiver les rappels dans leurs paramètres
- Les notifications de création sont toujours envoyées (si activées)
- La récurrence saisonnière génère automatiquement les événements de septembre à juin
