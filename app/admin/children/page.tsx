'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Parent {
  _id: string;
  name: string;
  email: string;
}

interface Team {
  _id: string;
  name: string;
  category: string;
}

interface ChildRow {
  _id: string;
  name: string;
  birthDate: string;
  parentId: Parent | string;
  parentId2?: Parent | string;
  teamId: Team | string;
}

export default function AdminChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [editChild, setEditChild] = useState<ChildRow | null>(null);
  const [showCreateChild, setShowCreateChild] = useState(false);
  const [linkModal, setLinkModal] = useState<{ url: string; childName: string; parentName?: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'admin') {
          router.replace('/login');
          return;
        }
        setCheckingAuth(false);
        fetchData();
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const fetchData = async () => {
    try {
      const [childrenRes, parentsRes, teamsRes] = await Promise.all([
        fetch('/api/children', { credentials: 'include' }),
        fetch('/api/users?role=parent', { credentials: 'include' }),
        fetch('/api/teams', { credentials: 'include' }),
      ]);
      if (childrenRes.ok) {
        const d = await childrenRes.json();
        setChildren(d.children || []);
      }
      if (parentsRes.ok) {
        const d = await parentsRes.json();
        setParents(d.users || []);
      }
      if (teamsRes.ok) {
        const d = await teamsRes.json();
        setTeams(d.teams || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLoginLink = async (child: ChildRow, parentNumber: 1 | 2) => {
    const parentId = parentNumber === 1 
      ? (typeof child.parentId === 'object' ? child.parentId._id : child.parentId)
      : (child.parentId2 && typeof child.parentId2 === 'object' ? child.parentId2._id : child.parentId2);
    
    if (!parentId) {
      alert('Parent non trouvé');
      return;
    }

    try {
      const res = await fetch('/api/auth/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parentId }),
      });
      const data = await res.json();
      if (res.ok) {
        const parentName = parentNumber === 1
          ? (typeof child.parentId === 'object' ? child.parentId.name : 'Parent 1')
          : (child.parentId2 && typeof child.parentId2 === 'object' ? child.parentId2.name : 'Parent 2');
        setLinkModal({ url: data.url, childName: child.name, parentName });
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e) {
      alert('Erreur');
    }
  };

  const copyLink = () => {
    if (linkModal) {
      navigator.clipboard.writeText(linkModal.url);
      alert('Lien copié dans le presse-papier.');
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
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Enfants</h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateChild(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                Créer un enfant
              </button>
              <Link
                href="/admin"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Retour au menu
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p className="text-gray-600">Chargement...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Équipe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naissance</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {children.map((child) => (
                    <tr key={child._id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{child.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          {typeof child.parentId === 'object'
                            ? `${child.parentId.name} (${child.parentId.email})`
                            : '-'}
                        </div>
                        {child.parentId2 && (
                          <div className="mt-1 text-xs text-gray-500">
                            {typeof child.parentId2 === 'object'
                              ? `${child.parentId2.name} (${child.parentId2.email})`
                              : '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {typeof child.teamId === 'object'
                          ? `${child.teamId.name} (${child.teamId.category})`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {child.birthDate
                          ? format(new Date(child.birthDate), 'dd/MM/yyyy', { locale: fr })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditChild(child)}
                          className="text-blue-600 hover:underline"
                        >
                          Modifier
                        </button>
                        <div className="mt-1 space-y-1">
                          <button
                            type="button"
                            onClick={() => handleGetLoginLink(child, 1)}
                            className="text-green-600 hover:underline block"
                          >
                            Code Parent 1
                          </button>
                          {child.parentId2 && (
                            <button
                              type="button"
                              onClick={() => handleGetLoginLink(child, 2)}
                              className="text-green-600 hover:underline block"
                            >
                              Code Parent 2
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {children.length === 0 && (
              <p className="p-6 text-gray-500 text-center">
              Aucun enfant. Créez d&apos;abord un compte parent (Menu → Créer un compte), puis ajoutez un enfant ici en le reliant à ce parent.
            </p>
            )}
          </div>
        )}
      </div>

      {showCreateChild && (
        <CreateChildModal
          parents={parents}
          teams={teams}
          onClose={() => setShowCreateChild(false)}
          onSuccess={() => {
            setShowCreateChild(false);
            fetchData();
          }}
        />
      )}

      {editChild && (
        <EditChildModal
          child={editChild}
          parents={parents}
          teams={teams}
          onClose={() => setEditChild(null)}
          onSuccess={() => {
            setEditChild(null);
            fetchData();
          }}
        />
      )}

      {linkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-lg font-bold mb-2">Lien de connexion</h2>
            <p className="text-sm text-gray-600 mb-2">
              Envoyez ce lien {linkModal.parentName ? `à ${linkModal.parentName}` : 'au parent'} pour <strong>{linkModal.childName}</strong> (valable 24 h).
            </p>
            <input
              type="text"
              readOnly
              value={linkModal.url}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Copier le lien
              </button>
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateChildModal({
  parents,
  teams,
  onClose,
  onSuccess,
}: {
  parents: Parent[];
  teams: Team[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(parents[0]?._id ?? '');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?._id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          birthDate,
          parentId: selectedParentId,
          teamId: selectedTeamId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
        return;
      }
      onSuccess();
    } catch (e) {
      setError('Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Créer un enfant</h2>
        <p className="text-sm text-gray-600 mb-4">
          Saisissez le <strong>nom de l&apos;enfant</strong>. Le parent (compte créé via « Créer un compte ») reçoit les rappels sur son adresse mail.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
        )}
        {parents.length === 0 ? (
          <p className="text-amber-700 text-sm mb-4">
            Aucun compte parent. Créez d&apos;abord un parent via <Link href="/register" className="underline">Créer un compte</Link>, puis revenez ici.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;enfant</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex. Lucas, Chloé"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent (compte)</label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {parents.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Équipe</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || teams.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        )}
        {parents.length > 0 && teams.length === 0 && (
          <p className="text-amber-700 text-sm mt-2">Créez au moins une équipe (Menu → Gérer les équipes).</p>
        )}
      </div>
    </div>
  );
}

function EditChildModal({
  child,
  parents,
  teams,
  onClose,
  onSuccess,
}: {
  child: ChildRow;
  parents: Parent[];
  teams: Team[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const parentId = typeof child.parentId === 'object' ? child.parentId._id : child.parentId;
  const teamId = typeof child.teamId === 'object' ? child.teamId._id : child.teamId;
  const [name, setName] = useState(child.name);
  const [birthDate, setBirthDate] = useState(
    child.birthDate ? format(new Date(child.birthDate), 'yyyy-MM-dd') : ''
  );
  const [selectedParentId, setSelectedParentId] = useState(parentId);
  const [selectedTeamId, setSelectedTeamId] = useState(teamId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${child._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          birthDate,
          parentId: selectedParentId,
          teamId: selectedTeamId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
        return;
      }
      onSuccess();
    } catch (e) {
      setError('Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Modifier l’enfant</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {parents.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Équipe</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
