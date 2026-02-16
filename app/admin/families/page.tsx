'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Family {
  parent1: {
    id: string;
    name: string;
    email: string;
  };
  parent2?: {
    id: string;
    name: string;
    email: string;
  };
  children: Array<{
    id: string;
    name: string;
    teamId: { name: string; category: string };
    birthDate: Date | string;
  }>;
}

export default function AdminFamiliesPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [deletingFamilyId, setDeletingFamilyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'admin') {
          router.replace('/login');
          return;
        }
        setCheckingAuth(false);
        fetchFamilies();
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const fetchFamilies = async () => {
    try {
      const res = await fetch('/api/admin/families', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFamilies(data.families || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFamily = async (parentId: string) => {
    if (confirmDelete !== parentId) {
      setConfirmDelete(parentId);
      return;
    }

    setDeletingFamilyId(parentId);
    try {
      const res = await fetch('/api/admin/families', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la suppression');
        return;
      }

      // Recharger la liste
      fetchFamilies();
      setConfirmDelete(null);
    } catch (e) {
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingFamilyId(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Liste des familles</h1>
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Retour au menu
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : families.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">Aucune famille créée.</p>
            <Link
              href="/admin/create-family"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Créer une famille
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent(s)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enfants</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {families.map((family) => (
                    <tr key={family.parent1.id}>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900 font-medium">
                          {family.parent1.name}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {family.parent1.email}
                        </div>
                        {family.parent2 && (
                          <>
                            <div className="text-gray-900 font-medium mt-2">
                              {family.parent2.name}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {family.parent2.email}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {family.children.length === 0 ? (
                          <span className="text-gray-400">Aucun enfant</span>
                        ) : (
                          <div className="space-y-1">
                            {family.children.map((child) => (
                              <div key={child.id} className="text-gray-900">
                                <span className="font-medium">{child.name}</span>
                                <span className="text-gray-600 text-xs ml-2">
                                  ({child.teamId.name} {child.teamId.category && `- ${child.teamId.category}`})
                                </span>
                                {child.birthDate && (
                                  <span className="text-gray-500 text-xs ml-2">
                                    né(e) le {format(new Date(child.birthDate), 'dd/MM/yyyy', { locale: fr })}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {confirmDelete === family.parent1.id ? (
                          <div className="flex flex-col gap-2 items-end">
                            <span className="text-red-600 text-xs mb-1">Confirmer la suppression ?</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFamily(family.parent1.id)}
                                disabled={deletingFamilyId === family.parent1.id}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingFamilyId === family.parent1.id ? 'Suppression...' : 'Supprimer'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteFamily(family.parent1.id)}
                            disabled={deletingFamilyId === family.parent1.id}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
