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
  const [linkModal, setLinkModal] = useState<{ url: string; childName: string } | null>(null);

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

  const handleGetLoginLink = async (child: ChildRow) => {
    const parentId = typeof child.parentId === 'object' ? child.parentId._id : child.parentId;
    try {
      const res = await fetch('/api/auth/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkModal({ url: data.url, childName: child.name });
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Enfants</h1>
            <Link
              href="/admin"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Retour à l’administration
            </Link>
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
                        {typeof child.parentId === 'object'
                          ? `${child.parentId.name} (${child.parentId.email})`
                          : '-'}
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
                        <button
                          type="button"
                          onClick={() => handleGetLoginLink(child)}
                          className="text-green-600 hover:underline"
                        >
                          Recevoir un code connexion
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {children.length === 0 && (
              <p className="p-6 text-gray-500 text-center">Aucun enfant.</p>
            )}
          </div>
        )}
      </div>

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
              Envoyez ce lien au parent de <strong>{linkModal.childName}</strong> (valable 24 h).
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
