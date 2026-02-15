'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Event {
  _id: string;
  type: 'training' | 'match' | 'tournament';
  date: string;
  time: string;
  location: string;
  teamId: {
    name: string;
    category: string;
  };
}

interface Availability {
  _id: string;
  eventId: {
    _id: string;
    type: string;
    date: string;
    time: string;
    location: string;
  };
  childId: {
    _id: string;
    name: string;
  };
  parentId: {
    name: string;
    email: string;
  };
  status: 'present' | 'absent' | 'pending';
  comment: string;
}

export default function EducatorAvailabilitiesPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAvailabilities(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        if (data.events && data.events.length > 0) {
          setSelectedEventId(data.events[0]._id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async (eventId: string) => {
    try {
      const response = await fetch(`/api/availabilities?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailabilities(data.availabilities || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des disponibilités:', error);
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'training':
        return 'Entraînement';
      case 'match':
        return 'Match';
      case 'tournament':
        return 'Tournoi';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return { label: 'Présent', color: 'bg-green-100 text-green-800' };
      case 'absent':
        return { label: 'Absent', color: 'bg-red-100 text-red-800' };
      case 'pending':
        return { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const selectedEvent = events.find(e => e._id === selectedEventId);
  const presentCount = availabilities.filter(a => a.status === 'present').length;
  const absentCount = availabilities.filter(a => a.status === 'absent').length;
  const pendingCount = availabilities.filter(a => a.status === 'pending').length;

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
            <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
            <button
              onClick={() => router.push('/educator/events')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retour aux événements
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Événements</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map(event => (
                  <button
                    key={event._id}
                    onClick={() => setSelectedEventId(event._id)}
                    className={`w-full text-left p-3 rounded-md border ${
                      selectedEventId === event._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {format(new Date(event.date), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getEventTypeLabel(event.type)} - {event.time}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">
                    {getEventTypeLabel(selectedEvent.type)}
                  </h2>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Date:</strong> {format(new Date(selectedEvent.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                    <p>
                      <strong>Heure:</strong> {selectedEvent.time}
                    </p>
                    <p>
                      <strong>Lieu:</strong> {selectedEvent.location}
                    </p>
                    <p>
                      <strong>Équipe:</strong> {selectedEvent.teamId.name} ({selectedEvent.teamId.category})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                    <div className="text-sm text-green-700">Présents</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                    <div className="text-sm text-red-700">Absents</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                    <div className="text-sm text-yellow-700">En attente</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Liste des joueurs</h3>
                  <div className="space-y-2">
                    {availabilities.length > 0 ? (
                      availabilities.map(availability => {
                        const statusInfo = getStatusLabel(availability.status);
                        return (
                          <div
                            key={availability._id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                          >
                            <div>
                              <div className="font-medium">{availability.childId.name}</div>
                              <div className="text-sm text-gray-600">
                                Parent: {availability.parentId.name} ({availability.parentId.email})
                              </div>
                              {availability.comment && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {availability.comment}
                                </div>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Aucune disponibilité déclarée pour cet événement
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">Sélectionnez un événement</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
