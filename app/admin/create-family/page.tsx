'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ALL_APP_ROLES, ROLE_LABELS, type AppRole } from '@/lib/userRoles';

interface Team {
  _id: string;
  name: string;
  category: string;
}

export default function CreateFamilyPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    parent2Name: '',
    parent2Email: '',
    children: [] as Array<{ name: string; teamId: string }>,
  });
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(['parent']);
  /** Équipes auxquelles l’éducateur est affecté (affichage planning / présences) */
  const [educatorTeamIds, setEducatorTeamIds] = useState<string[]>([]);

  const toggleRole = (r: AppRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(r)) {
        const next = prev.filter((x) => x !== r);
        return next.length >= 1 ? next : prev;
      }
      return [...prev, r].sort((a, b) => ALL_APP_ROLES.indexOf(a) - ALL_APP_ROLES.indexOf(b));
    });
  };

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'admin') {
          router.replace('/login');
          return;
        }
        setCheckingAuth(false);
        fetchTeams();
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    if (!selectedRoles.includes('educator')) {
      setEducatorTeamIds([]);
    }
  }, [selectedRoles]);

  const toggleEducatorTeam = (teamId: string) => {
    setEducatorTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const selectAllEducatorTeams = () => {
    setEducatorTeamIds(teams.map((t) => t._id));
  };

  const selectNoneEducatorTeams = () => {
    setEducatorTeamIds([]);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/create-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          roles: selectedRoles,
          educatorTeamIds: selectedRoles.includes('educator') ? educatorTeamIds : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/children');
      }, 2000);
    } catch (e) {
      setError('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => {
    setFormData({
      ...formData,
      children: [...formData.children, { name: '', teamId: '' }],
    });
  };

  const removeChild = (index: number) => {
    if (selectedRoles.includes('parent') && formData.children.length <= 1) {
      return;
    }
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-green-600 mb-4">Famille créée avec succès !</h2>
          <p className="text-gray-600">Redirection vers la liste des enfants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Créer une famille</h1>
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Retour au menu
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
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
              <span className="block text-sm font-medium text-gray-700 mb-2">Rôles du compte *</span>
              <p className="text-xs text-gray-500 mb-2">Cochez un ou plusieurs profils (ex. parent + éducateur).</p>
              <div className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                {ALL_APP_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(r)}
                      onChange={() => toggleRole(r)}
                      className="rounded border-gray-300"
                    />
                    <span>{ROLE_LABELS[r]}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedRoles.includes('educator') && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">Équipes visibles par cet éducateur</h2>
                <p className="text-sm text-gray-600 mb-3">
                  Cochez les équipes dont cet éducateur pourra voir les événements et les présences. Une même équipe ne peut avoir qu’un éducateur principal : l’affectation remplace l’éventuel éducateur précédent sur l’équipe.
                </p>
                {teams.length === 0 ? (
                  <p className="text-amber-800 text-sm">
                    Aucune équipe en base. Créez des équipes (menu administrateur → équipes) puis revenez sur cette page.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        onClick={selectAllEducatorTeams}
                        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        type="button"
                        onClick={selectNoneEducatorTeams}
                        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                      >
                        Tout désélectionner
                      </button>
                    </div>
                    <ul className="space-y-2 max-h-56 overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                      {teams.map((team) => (
                        <li key={team._id}>
                          <label className="flex items-center gap-3 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={educatorTeamIds.includes(team._id)}
                              onChange={() => toggleEducatorTeam(team._id)}
                              className="rounded border-gray-300"
                            />
                            <span>
                              <span className="font-medium">{team.name}</span>
                              <span className="text-gray-500"> ({team.category})</span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Enfants{' '}
                  {(selectedRoles.includes('admin') || selectedRoles.includes('educator')) && (
                    <span className="text-sm font-normal text-gray-500">(optionnel)</span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={addChild}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + Ajouter un enfant
                </button>
              </div>

              {selectedRoles.includes('admin') && !selectedRoles.includes('parent') && formData.children.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Pour créer un administrateur sans enfant associé, vous pouvez laisser cette section vide.
                  </p>
                </div>
              )}

              {selectedRoles.includes('educator') && !selectedRoles.includes('parent') && formData.children.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Un éducateur peut être créé sans enfant : il accède au planning (présences, équipes) sans fiche enfant.
                  </p>
                </div>
              )}

              {teams.length === 0 && formData.children.length > 0 && (
                <p className="text-amber-700 text-sm mb-4">
                  Créez au moins une équipe (Menu → Gérer les équipes) avant de créer des enfants.
                </p>
              )}

              {formData.children.map((child, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Enfant {index + 1}</h3>
                    {(!selectedRoles.includes('parent') || formData.children.length > 1) && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l&apos;enfant {selectedRoles.includes('parent') && index === 0 ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(index, 'name', e.target.value)}
                        required={selectedRoles.includes('parent') && index === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Équipe {selectedRoles.includes('parent') && index === 0 ? '*' : ''}
                      </label>
                      <select
                        value={child.teamId}
                        onChange={(e) => updateChild(index, 'teamId', e.target.value)}
                        required={selectedRoles.includes('parent') && index === 0}
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
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link
                href="/admin"
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer la famille'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
