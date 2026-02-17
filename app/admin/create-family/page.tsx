'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    role: 'parent' as 'parent' | 'educator' | 'admin',
    children: [] as Array<{ name: string; teamId: string }>,
  });

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
        body: JSON.stringify(formData),
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
    // Pour les admins, on peut supprimer tous les enfants
    // Pour les autres rôles, on garde au moins un enfant
    if (formData.role === 'admin' || formData.children.length > 1) {
      setFormData({
        ...formData,
        children: formData.children.filter((_, i) => i !== index),
      });
    }
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="parent">Parent</option>
                <option value="educator">Éducateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Enfants {formData.role === 'admin' && <span className="text-sm font-normal text-gray-500">(optionnel)</span>}
                </h2>
                <button
                  type="button"
                  onClick={addChild}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + Ajouter un enfant
                </button>
              </div>

              {formData.role === 'admin' && formData.children.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Pour créer un administrateur sans enfant associé, vous pouvez laisser cette section vide.
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
                    {(formData.role === 'admin' || formData.children.length > 1) && (
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
                        Nom de l&apos;enfant {formData.role !== 'admin' && index === 0 ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(index, 'name', e.target.value)}
                        required={formData.role !== 'admin' && index === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Équipe {formData.role !== 'admin' && index === 0 ? '*' : ''}
                      </label>
                      <select
                        value={child.teamId}
                        onChange={(e) => updateChild(index, 'teamId', e.target.value)}
                        required={formData.role !== 'admin' && index === 0}
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
