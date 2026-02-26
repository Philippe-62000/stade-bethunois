'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import { getEventTypeLabel } from '@/lib/eventTypes';

interface Event {
  _id: string;
  type: string;
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

interface EventWithAvailabilities {
  event: Event;
  availabilities: Availability[];
}

function EducatorAvailabilitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const printAllTeamsRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<{ key: string; label: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTeamsData, setAllTeamsData] = useState<EventWithAvailabilities[] | null>(null);
  const [loadingAllTeams, setLoadingAllTeams] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAvailabilities(selectedEventId);
    }
  }, [selectedEventId]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dateParam = searchParams.get('date') || todayStr;
  const displayedEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    const target = new Date(dateParam);
    target.setHours(0, 0, 0, 0);
    return eventDate.getTime() >= target.getTime();
  });

  useEffect(() => {
    const filtered = events.filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      const target = new Date(dateParam);
      target.setHours(0, 0, 0, 0);
      return eventDate.getTime() >= target.getTime();
    });
    if (filtered.length > 0 && (!selectedEventId || !filtered.some(e => e._id === selectedEventId))) {
      setSelectedEventId(filtered[0]._id);
    }
  }, [dateParam, events]);

  const fetchEvents = async () => {
    try {
      const dateParam = searchParams.get('date');
      const [eventsRes, eventTypesRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/event-types'),
      ]);
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        const allEvents = data.events || [];
        setEvents(allEvents);
        if (allEvents.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const minDate = dateParam ? new Date(dateParam) : today;
          minDate.setHours(0, 0, 0, 0);
          const futureEvents = allEvents.filter((e: Event) => {
            const eventDate = new Date(e.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() >= minDate.getTime();
          });
          setSelectedEventId(futureEvents.length > 0 ? futureEvents[0]._id : null);
        }
      }
      if (eventTypesRes.ok) {
        const etData = await eventTypesRes.json();
        setEventTypes(etData.eventTypes || []);
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

  const handlePrintAllTeams = useReactToPrint({
    contentRef: printAllTeamsRef,
    documentTitle: selectedEvent ? `Présences toutes équipes - ${format(new Date(selectedEvent.date), 'dd-MM-yyyy', { locale: fr })}` : 'Présences',
    onAfterPrint: () => {
      setAllTeamsData(null);
      setLoadingAllTeams(false);
    },
  });

  const onPrintAllTeamsClick = async () => {
    if (!selectedEvent) return;
    setLoadingAllTeams(true);
    try {
      const selectedDate = new Date(selectedEvent.date);
      const dayEvents = events.filter(e => isSameDay(new Date(e.date), selectedDate));
      const results: EventWithAvailabilities[] = await Promise.all(
        dayEvents.map(async (event) => {
          const res = await fetch(`/api/availabilities?eventId=${event._id}`);
          const data = await res.json();
          return { event, availabilities: data.availabilities || [] };
        })
      );
      setAllTeamsData(results);
    } catch (e) {
      console.error(e);
      setLoadingAllTeams(false);
    }
  };

  useEffect(() => {
    if (allTeamsData && allTeamsData.length > 0) {
      const timer = setTimeout(() => {
        handlePrintAllTeams();
        // Nettoyage dans onAfterPrint pour ne pas supprimer le contenu avant la capture par le print
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allTeamsData]);
  
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
              <h2 className="text-lg font-semibold mb-2">Événements</h2>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">À partir du</label>
                <input
                  type="date"
                  min={todayStr}
                  value={dateParam}
                  onChange={(e) => router.push(`/educator/availabilities?date=${e.target.value}`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayedEvents.map(event => (
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
                      {getEventTypeLabel(event.type, eventTypes)} - {event.time}
                    </div>
                    <div className="text-xs font-medium text-blue-600 mt-1">
                      {event.teamId?.name} {event.teamId?.category && `(${event.teamId.category})`}
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
                    {getEventTypeLabel(selectedEvent.type, eventTypes)}
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
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Imprimer en PDF
                  </button>
                  <button
                    onClick={onPrintAllTeamsClick}
                    disabled={loadingAllTeams}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    {loadingAllTeams ? 'Préparation...' : 'Imprimer en PDF toutes les équipes'}
                  </button>
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

                <div ref={printRef} className="print:p-6 print:max-w-4xl print:mx-auto">
                  <style>{`
                    @media print {
                      @page { margin: 12mm; size: A4; }
                      body { margin: 0; padding: 0; }
                      .print-single-team-block { page-break-inside: avoid; }
                    }
                  `}</style>
                  <div className="mb-4 print:hidden">
                    <h3 className="text-lg font-semibold">Liste des joueurs</h3>
                  </div>
                  <div className="print:block hidden print:mb-4 print:text-center">
                    <h3 className="text-base font-bold mb-2">Liste des joueurs</h3>
                    <div className="text-xs text-gray-600 mb-2 space-y-0.5">
                      <p><strong>Date:</strong> {format(new Date(selectedEvent.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
                      <p><strong>Heure:</strong> {selectedEvent.time} — <strong>Lieu:</strong> {selectedEvent.location}</p>
                      <p><strong>Équipe:</strong> {selectedEvent.teamId.name} ({selectedEvent.teamId.category})</p>
                    </div>
                    <div className="text-sm font-semibold mb-3 pt-2 border-t">
                      Total des enfants présents : {presentCount}
                    </div>
                  </div>
                  <div className="space-y-2 print:space-y-0 print-single-team-block">
                    {availabilities.length > 0 ? (
                      <table className="w-full print:text-xs">
                        <tbody>
                          {availabilities.map(availability => {
                            const statusInfo = getStatusLabel(availability.status);
                            return (
                              <tr key={availability._id} className="border-b border-gray-200 print:border-gray-300">
                                <td className="py-2 print:py-1 font-medium">
                                  {availability.childId.name}
                                  {availability.comment && (
                                    <span className="text-sm text-gray-500 print:text-xs block">{availability.comment}</span>
                                  )}
                                </td>
                                <td className={`py-2 print:py-1 text-right text-xs font-semibold ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
                <p className="text-gray-500 text-center">
                  {displayedEvents.length === 0
                    ? `Aucun événement à partir du ${format(new Date(dateParam), 'dd/MM/yyyy', { locale: fr })}`
                    : 'Sélectionnez un événement'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone pour l'impression de toutes les équipes - hors écran pour que react-to-print capture tout */}
      {allTeamsData && allTeamsData.length > 0 && selectedEvent && (
        <div
          ref={printAllTeamsRef}
          className="print-all-teams-root fixed left-[-9999px] top-0 w-[210mm] bg-white"
          style={{ visibility: 'hidden' }}
        >
          <style>{`
            @media print {
              .print-all-teams-root { visibility: visible !important; position: static !important; left: auto !important; width: 100% !important; }
              .print-all-teams-wrapper { visibility: visible !important; }
              .print-team-block { page-break-after: always; page-break-inside: avoid; }
              .print-team-block:last-child { page-break-after: auto; }
              @page { margin: 12mm; size: A4; }
              body { margin: 0; padding: 0; }
            }
          `}</style>
          <div className="print-all-teams-wrapper p-6">
            <h2 className="text-lg font-bold mb-3 text-center">
              Présences - {format(new Date(selectedEvent.date), 'EEEE d MMMM yyyy', { locale: fr })}
            </h2>
            {allTeamsData.map(({ event, availabilities: avs }, idx) => (
              <div key={event._id} className={`print-team-block py-4 ${idx > 0 ? 'mt-4' : ''}`}>
                <h3 className="text-sm font-semibold mb-1 border-b border-gray-300 pb-1">
                  {getEventTypeLabel(event.type, eventTypes)} - {event.time} - {event.teamId?.name} ({event.teamId?.category})
                </h3>
                <p className="text-xs text-gray-600 mb-2">{event.location}</p>
                <table className="w-full text-xs">
                  <tbody>
                    {avs.length > 0 ? (
                      avs.map((a) => {
                        const statusInfo = getStatusLabel(a.status);
                        return (
                          <tr key={a._id} className="border-b border-gray-100">
                            <td className="py-0.5 font-medium">{a.childId?.name || '-'}</td>
                            <td className="py-0.5 text-right">{statusInfo.label}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={2} className="py-1 text-gray-500 text-xs">Aucune présence déclarée</td></tr>
                    )}
                  </tbody>
                </table>
                <p className="text-xs font-medium mt-1">
                  Présents : {avs.filter(a => a.status === 'present').length} | Absents : {avs.filter(a => a.status === 'absent').length} | En attente : {avs.filter(a => a.status === 'pending').length}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EducatorAvailabilitiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    }>
      <EducatorAvailabilitiesContent />
    </Suspense>
  );
}
