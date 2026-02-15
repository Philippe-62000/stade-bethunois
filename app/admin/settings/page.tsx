'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Place {
  _id: string;
  name: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'admin') {
          router.replace('/login');
          return;
        }
        setCheckingAuth(false);
        fetchPlaces();
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const fetchPlaces = async () => {
    try {
      const res = await fetch('/api/places', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPlaces(data.places || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = newPlaceName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
        return;
      }
      setNewPlaceName('');
      setPlaces((prev) => [...prev, data.place]);
    } catch (e) {
      setError('Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (!confirm('Supprimer ce lieu ?')) return;
    try {
      const res = await fetch(`/api/places/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setPlaces((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (checkingAuth) {
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Retour au menu
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Lieux</h2>
          <p className="text-sm text-gray-600 mb-4">
            Les lieux définis ici seront proposés lors de la création d’une récurrence ou d’un événement.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleAddPlace} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              placeholder="Ex. Terrain 1, Gymnase, 8 Ter"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
          <ul className="space-y-2">
            {places.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun lieu. Ajoutez-en un ci-dessus.</p>
            ) : (
              places.map((place) => (
                <li
                  key={place._id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{place.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePlace(place._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
