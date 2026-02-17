'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import emailjs from '@emailjs/browser';

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

    const parentName = parentNumber === 1
      ? (typeof child.parentId === 'object' ? child.parentId.name : 'Parent 1')
      : (child.parentId2 && typeof child.parentId2 === 'object' ? child.parentId2.name : 'Parent 2');
    const parentEmail = parentNumber === 1
      ? (typeof child.parentId === 'object' ? child.parentId.email : '')
      : (child.parentId2 && typeof child.parentId2 === 'object' ? child.parentId2.email : '');

    // Demander confirmation pour envoyer l'email
    if (confirm(`Envoyer un email à ${parentName} (${parentEmail}) avec le code de connexion ?`)) {
      try {
        const res = await fetch('/api/auth/login-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ parentId, sendEmail: true }),
        });
        const data = await res.json();
        if (res.ok) {
          // Envoyer l'email depuis le client avec EmailJS
          if (data.sendEmail) {
            try {
              // Récupérer la configuration EmailJS depuis l'API
              const configRes = await fetch('/api/emailjs-config', { credentials: 'include' });
              const config = await configRes.json();
              
              if (config.serviceId && config.templateIdLoginCode && config.publicKey) {
                // Vérifier que l'email du parent est bien défini
                if (!data.parentEmail || data.parentEmail.trim() === '') {
                  alert('Erreur : l\'adresse email du parent est vide');
                  return;
                }

                // Générer le HTML complet pour le template EmailJS
                const htmlMessage = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de connexion</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0;">Code de connexion</h1>
    <p>Bonjour ${data.parentName || 'Parent'},</p>
    <p>Voici votre code de connexion pour accéder au planning de votre enfant :</p>
    <div style="background-color: #ffffff; border: 2px solid #2563eb; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Votre code de connexion :</p>
      <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">${data.code || ''}</p>
    </div>
    <p>Pour vous connecter, rendez-vous sur :</p>
    <p style="margin: 20px 0;">
      <a href="${data.siteUrl || ''}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder au planning</a>
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Ce code est valable sans limitation de temps. Vous pouvez le modifier à tout moment depuis votre espace parent.
    </p>
    <p style="font-size: 14px; color: #666;">
      Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
      Cette adresse n'est utilisée que pour envoyer des emails dans le cadre de ce site, la boite mail n'est pas consultée, si vous souhaitez écrire au club merci d'utiliser l'adresse habituelle.
    </p>
  </div>
</body>
</html>
                `.trim();
                
                // Préparer les paramètres du template avec toutes les variables possibles pour le destinataire
                const templateParams = {
                  html_message: htmlMessage,
                  to_email: data.parentEmail.trim(),
                  user_email: data.parentEmail.trim(), // Alternative pour certains services EmailJS
                  to_name: data.parentName || '',
                  reply_to: data.parentEmail.trim(),
                  subject: 'Code de connexion - Stade Béthunois',
                  parent_name: data.parentName || '',
                  site_url: data.siteUrl || '',
                  login_code: data.code || '',
                };
                
                console.log('Envoi EmailJS avec:', {
                  serviceId: config.serviceId,
                  templateId: config.templateIdLoginCode,
                  to_email: data.parentEmail,
                  templateParams: { ...templateParams, html_message: '[HTML...]' }, // Ne pas logger tout le HTML
                });
                
                // Envoyer l'email avec les paramètres du template
                const result = await emailjs.send(
                  config.serviceId,
                  config.templateIdLoginCode,
                  templateParams,
                  config.publicKey
                );
                
                console.log('Résultat EmailJS:', result);
                
                if (result.status === 200 || result.text === 'OK') {
                  alert(`Email envoyé à ${parentEmail}`);
                } else {
                  throw new Error(result.text || `Erreur ${result.status || 'inconnue'}`);
                }
              } else {
                alert('Configuration EmailJS manquante. Veuillez configurer les variables d\'environnement EmailJS.');
              }
            } catch (emailError: any) {
              console.error('Erreur envoi email:', emailError);
              const errorMessage = emailError?.text || emailError?.message || emailError?.toString() || 'Erreur inconnue';
              console.error('Détails erreur:', {
                status: emailError?.status,
                text: emailError?.text,
                message: emailError?.message,
                error: emailError,
              });
              alert(`Erreur lors de l'envoi de l'email: ${errorMessage}\n\nVérifiez que le template EmailJS utilise les variables: parent_name, site_url, login_code, to_email.`);
            }
          }
        } else {
          alert(data.error || 'Erreur');
        }
      } catch (e) {
        alert('Erreur');
      }
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
              Aucun enfant. Les enfants sont ajoutés via le formulaire « Créer un compte » (Menu → Créer un compte).
            </p>
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
