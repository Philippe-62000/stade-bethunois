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
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [teams, setTeams] = useState<Array<{ _id: string; name: string; category: string }>>([]);

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
        fetchTeams();
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingFamily(family)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFamily(family.parent1.id)}
                              disabled={deletingFamilyId === family.parent1.id}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
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

      {editingFamily && (
        <EditFamilyModal
          family={editingFamily}
          teams={teams}
          onClose={() => {
            setEditingFamily(null);
            fetchFamilies();
          }}
        />
      )}
    </div>
  );
}

function EditFamilyModal({
  family,
  teams,
  onClose,
}: {
  family: Family;
  teams: Array<{ _id: string; name: string; category: string }>;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    parentName: family.parent1.name,
    parentEmail: family.parent1.email,
    parent2Name: family.parent2?.name || '',
    parent2Email: family.parent2?.email || '',
    children: family.children.map(c => ({
      id: c.id,
      name: c.name,
      teamId: teams.find(t => t.name === c.teamId.name)?._id || '',
      birthDate: c.birthDate ? format(new Date(c.birthDate), 'yyyy-MM-dd') : '',
    })),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addChild = () => {
    setFormData({
      ...formData,
      children: [...formData.children, { id: '', name: '', teamId: '', birthDate: '' }],
    });
  };

  const removeChild = (index: number) => {
    setFormData({
      ...formData,
      children: formData.children.filter((_, i) => i !== index),
    });
  };

  const updateChild = (index: number, field: string, value: string) => {
    const newChildren = [...formData.children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setFormData({ ...formData, children: newChildren });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/families/${family.parent1.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la modification');
        return;
      }

      onClose();
    } catch (e) {
      setError('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Modifier la famille</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Parent 1</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Parent 1 *
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Parent 1 *
                </label>
                <input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Parent 2 (optionnel)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Parent 2
                </label>
                <input
                  type="text"
                  value={formData.parent2Name}
                  onChange={(e) => setFormData({ ...formData, parent2Name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Parent 2
                </label>
                <input
                  type="email"
                  value={formData.parent2Email}
                  onChange={(e) => setFormData({ ...formData, parent2Email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Enfants</h2>
              <button
                type="button"
                onClick={addChild}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Ajouter un enfant
              </button>
            </div>

            {formData.children.map((child, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Enfant {index + 1}</h3>
                  {formData.children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l&apos;enfant {index === 0 ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) => updateChild(index, 'name', e.target.value)}
                      required={index === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Équipe {index === 0 ? '*' : ''}
                    </label>
                    <select
                      value={child.teamId}
                      onChange={(e) => updateChild(index, 'teamId', e.target.value)}
                      required={index === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Sélectionner</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name} ({team.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de naissance {index === 0 ? '*' : ''}
                    </label>
                    <input
                      type="date"
                      value={child.birthDate}
                      onChange={(e) => updateChild(index, 'birthDate', e.target.value)}
                      required={index === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Modification...' : 'Modifier la famille'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
