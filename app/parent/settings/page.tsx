'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationSettings {
  enabled: boolean;
  reminderEnabled: boolean;
}

export default function ParentSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    reminderEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user?.notificationSettings) {
          setSettings(data.user.notificationSettings);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('Paramètres sauvegardés avec succès');
      } else {
        setMessage('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      setMessage('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <button
              onClick={() => router.push('/parent/calendar')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Retour au calendrier
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Notifications</h2>

          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="enabled"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-3 block text-sm text-gray-700">
                <span className="font-medium">Recevoir les notifications</span>
                <p className="text-gray-500 text-xs mt-1">
                  Lors de la création d'événements ciblés pour mes enfants
                </p>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="reminderEnabled"
                checked={settings.reminderEnabled}
                onChange={(e) => setSettings({ ...settings, reminderEnabled: e.target.checked })}
                disabled={!settings.enabled}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="reminderEnabled" className="ml-3 block text-sm text-gray-700">
                <span className="font-medium">Rappels si je n'ai pas répondu</span>
                <p className="text-gray-500 text-xs mt-1">
                  Envoyés tous les matins à 8h pour les événements dans 2 jours
                </p>
                <p className="text-gray-400 text-xs mt-1 italic">
                  Les rappels sont envoyés automatiquement tous les matins à 8h pour vous rappeler de répondre aux événements dans 2 jours.
                </p>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
