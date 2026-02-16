'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';

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
  const printRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [filteredAvailabilities, setFilteredAvailabilities] = useState<Availability[]>([]);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAvailabilities(selectedEventId);
      setSelectedTeamFilter('all'); // Réinitialiser le filtre quand on change d'événement
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (selectedTeamFilter === 'all') {
      setFilteredAvailabilities(availabilities);
    } else {
      // Filtrer par équipe : ne montrer que si l'équipe de l'événement sélectionné correspond
      const selectedEvent = events.find(e => e._id === selectedEventId);
      if (selectedEvent && selectedEvent.teamId.name === selectedTeamFilter) {
        setFilteredAvailabilities(availabilities);
      } else {
        setFilteredAvailabilities([]);
      }
    }
  }, [availabilities, selectedTeamFilter, selectedEventId, events]);

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Liste des joueurs - ${selectedEvent ? format(new Date(selectedEvent.date), 'dd-MM-yyyy', { locale: fr }) : ''}`,
  });
  
  // Obtenir les équipes uniques depuis les événements
  const uniqueTeams = Array.from(
    new Map(
      events.map(event => [`${event.teamId.name}-${event.teamId.category}`, event.teamId])
    ).values()
  );

  const presentCount = filteredAvailabilities.filter(a => a.status === 'present').length;
  const absentCount = filteredAvailabilities.filter(a => a.status === 'absent').length;
  const pendingCount = filteredAvailabilities.filter(a => a.status === 'pending').length;

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
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
            <div className="flex gap-2">
              <a
                href="/admin"
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Retour au menu
              </a>
              <button
                onClick={() => router.push('/educator/events')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retour aux événements
              </button>
            </div>
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

                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label htmlFor="teamFilter" className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrer par équipe
                    </label>
                    <select
                      id="teamFilter"
                      value={selectedTeamFilter}
                      onChange={(e) => setSelectedTeamFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Toutes les équipes</option>
                      {uniqueTeams.map((team, index) => (
                        <option key={index} value={team.name}>
                          {team.name} ({team.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      Imprimer en PDF
                    </button>
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

                <div ref={printRef} className="print:p-8 print:max-w-4xl print:mx-auto">
                  <style jsx>{`
                    @media print {
                      @page {
                        margin: 2cm;
                      }
                      body {
                        margin: 0;
                        padding: 0;
                      }
                    }
                  `}</style>
                  <div className="mb-4 print:hidden">
                    <h3 className="text-lg font-semibold">Liste des joueurs</h3>
                  </div>
                  <div className="print:block hidden print:mb-6 print:text-center">
                    <h3 className="text-xl font-bold mb-4">Liste des joueurs</h3>
                    <div className="text-sm text-gray-600 mb-4 space-y-1">
                      <p><strong>Date:</strong> {format(new Date(selectedEvent.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
                      <p><strong>Heure:</strong> {selectedEvent.time}</p>
                      <p><strong>Lieu:</strong> {selectedEvent.location}</p>
                      <p><strong>Équipe:</strong> {selectedEvent.teamId.name} ({selectedEvent.teamId.category})</p>
                      {selectedTeamFilter !== 'all' && (
                        <p><strong>Filtre:</strong> {uniqueTeams.find(t => t.name === selectedTeamFilter)?.name}</p>
                      )}
                    </div>
                    <div className="text-lg font-semibold mb-4 pt-4 border-t">
                      Total des enfants présents : {presentCount}
                    </div>
                  </div>
                  <div className="space-y-2 print:space-y-1">
                    {filteredAvailabilities.length > 0 ? (
                      filteredAvailabilities.map(availability => {
                        const statusInfo = getStatusLabel(availability.status);
                        return (
                          <div
                            key={availability._id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-md print:p-2 print:border-b print:border-gray-300 print:rounded-none"
                          >
                            <div className="print:flex-1">
                              <div className="font-medium print:text-base">{availability.childId.name}</div>
                              {availability.comment && (
                                <div className="text-sm text-gray-500 mt-1 print:text-xs">
                                  {availability.comment}
                                </div>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} print:px-2 print:py-0.5`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-8 print:py-4">
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
