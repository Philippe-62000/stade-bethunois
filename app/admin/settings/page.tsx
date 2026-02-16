'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import emailjs from '@emailjs/browser';

interface Place {
  _id: string;
  name: string;
}

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

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
        fetchAdmins();
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

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/users?role=admin', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.users || []);
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

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Supprimer cet administrateur ?')) return;
    setDeletingAdminId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (e) {
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingAdminId(null);
    }
  };

  const handleSendCode = async (admin: Admin) => {
    if (!confirm(`Envoyer un email à ${admin.name} (${admin.email}) avec le code de connexion ?`)) {
      return;
    }

    try {
      const res = await fetch('/api/auth/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parentId: admin._id, sendEmail: true }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.sendEmail) {
          try {
            const configRes = await fetch('/api/emailjs-config', { credentials: 'include' });
            const config = await configRes.json();

            if (config.serviceId && config.templateIdLoginCode && config.publicKey) {
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
    <p>Bonjour ${data.parentName || 'Administrateur'},</p>
    <p>Voici votre code de connexion pour accéder au site :</p>
    <div style="background-color: #ffffff; border: 2px solid #2563eb; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Votre code de connexion :</p>
      <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">${data.code || ''}</p>
    </div>
    <p>Pour vous connecter, rendez-vous sur :</p>
    <p style="margin: 20px 0;">
      <a href="${data.siteUrl || ''}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder au site</a>
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Ce code est valable sans limitation de temps. Vous pouvez le modifier à tout moment depuis votre espace.
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

              const templateParams = {
                html_message: htmlMessage,
                to_email: data.parentEmail.trim(),
                user_email: data.parentEmail.trim(),
                to_name: data.parentName || '',
                reply_to: data.parentEmail.trim(),
                subject: 'Code de connexion - Stade Béthunois',
              };

              const result = await emailjs.send(
                config.serviceId,
                config.templateIdLoginCode,
                templateParams,
                config.publicKey
              );

              if (result.status === 200 || result.text === 'OK') {
                alert(`Email envoyé à ${admin.email}`);
              } else {
                throw new Error(result.text || `Erreur ${result.status || 'inconnue'}`);
              }
            } else {
              alert('Configuration EmailJS manquante.');
            }
          } catch (emailError: any) {
            console.error('Erreur envoi email:', emailError);
            const errorMessage = emailError?.text || emailError?.message || emailError?.toString() || 'Erreur inconnue';
            alert(`Erreur lors de l'envoi de l'email: ${errorMessage}`);
          }
        }
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e) {
      alert('Erreur lors de l\'envoi du code');
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

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Administrateurs</h2>
          <p className="text-sm text-gray-600 mb-4">
            Liste des administrateurs du site. Vous pouvez modifier leurs informations ou les supprimer.
          </p>
          {admins.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun administrateur.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin._id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{admin.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                      <td className="px-4 py-3 text-right text-sm space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSendCode(admin)}
                          className="text-green-600 hover:underline"
                        >
                          Envoyer code
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAdmin(admin)}
                          className="text-blue-600 hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(admin._id)}
                          disabled={deletingAdminId === admin._id}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingAdminId === admin._id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => {
            setEditingAdmin(null);
            fetchAdmins();
          }}
        />
      )}
    </div>
  );
}

function EditAdminModal({
  admin,
  onClose,
}: {
  admin: Admin;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${admin._id}`, {
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
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Modifier l'administrateur</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
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
              <option value="admin">Administrateur</option>
              <option value="educator">Éducateur</option>
              <option value="parent">Parent</option>
            </select>
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
              {loading ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
