'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'admin') {
          router.replace('/login');
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-sm text-gray-600 mt-1">Stade Béthunois</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/create-family"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">Créer une famille</h2>
            <p className="mt-2 text-sm text-gray-600">
              Créer un ou deux parents et leurs enfants en une seule fois. Pas de mot de passe requis.
            </p>
          </Link>
          <Link
            href="/admin/families"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">Liste des familles</h2>
            <p className="mt-2 text-sm text-gray-600">
              Voir toutes les familles créées (parents et enfants). Supprimer une famille complète.
            </p>
          </Link>
          <Link
            href="/admin/children"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">Liste des enfants</h2>
            <p className="mt-2 text-sm text-gray-600">
              Créez d&apos;abord un compte parent (Créer un compte), puis ajoutez ici l&apos;enfant (nom de l&apos;enfant) relié à ce parent. Voir, modifier, lien connexion.
            </p>
          </Link>
          <Link
            href="/educator/teams"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">Gérer les équipes</h2>
            <p className="mt-2 text-sm text-gray-600">
              Créer et gérer les équipes (U12, U15, etc.) pour les récurrences et événements.
            </p>
          </Link>
          <Link
            href="/educator/events"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">Gestion des événements</h2>
            <p className="mt-2 text-sm text-gray-600">
              Créer des entraînements, matchs et tournois.
            </p>
          </Link>
          <Link
            href="/admin/settings"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">Paramètres</h2>
            <p className="mt-2 text-sm text-gray-600">
              Définir les lieux proposés pour les récurrences et événements.
            </p>
          </Link>
          <Link
            href="/admin/change-password"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
            <p className="mt-2 text-sm text-gray-600">
              Modifier votre mot de passe de connexion.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
