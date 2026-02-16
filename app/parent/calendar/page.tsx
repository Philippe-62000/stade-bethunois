'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Event {
  _id: string;
  type: 'training' | 'match' | 'tournament';
  date: string;
  time: string;
  location: string;
  selectedChildrenIds?: string[] | null;
  teamId: {
    name: string;
    category: string;
  };
}

interface Child {
  _id: string;
  name: string;
  teamId: {
    name: string;
    category: string;
  };
}

interface Availability {
  _id: string;
  eventId: {
    _id: string;
  };
  childId: {
    _id: string;
  };
  status: 'present' | 'absent' | 'pending';
}

export default function ParentCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, childrenRes, availabilitiesRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/children'),
        fetch('/api/availabilities'),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        const childrenList = childrenData.children || [];
        setChildren(childrenList);
        // Sélectionner le premier enfant par défaut
        if (childrenList.length > 0 && !selectedChildId) {
          setSelectedChildId(childrenList[0]._id);
        }
      }

      if (availabilitiesRes.ok) {
        const availabilitiesData = await availabilitiesRes.json();
        setAvailabilities(availabilitiesData.availabilities || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    setSelectedEvents(dayEvents);
  };

  const handleAvailabilityChange = async (eventId: string, status: 'present' | 'absent') => {
    if (!selectedChildId) return;
    const childId = selectedChildId;
    try {
      const response = await fetch('/api/availabilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          childId,
          status,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleMonthAction = async (month: Date, status: 'present' | 'absent') => {
    if (!selectedChildId) return;
    
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return isSameMonth(eventDate, month) && eventDate >= monthStart && eventDate <= monthEnd;
    });

    const selectedChild = children.find(c => c._id === selectedChildId);
    if (!selectedChild) return;

    try {
      const promises = [];
      for (const event of monthEvents) {
        const isRelevant = event.selectedChildrenIds && event.selectedChildrenIds.length > 0
          ? event.selectedChildrenIds.includes(selectedChildId)
          : selectedChild.teamId.name === event.teamId.name;
        
        if (isRelevant) {
          promises.push(
            fetch('/api/availabilities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId: event._id,
                childId: selectedChildId,
                status,
              }),
            })
          );
        }
      }
      await Promise.all(promises);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour mensuelle:', error);
    }
  };

  // Filtrer les événements et disponibilités selon l'enfant sélectionné
  const filteredEvents = selectedChildId
    ? events.filter(event => {
        if (event.selectedChildrenIds && event.selectedChildrenIds.length > 0) {
          return event.selectedChildrenIds.includes(selectedChildId);
        }
        const child = children.find(c => c._id === selectedChildId);
        return child && child.teamId.name === event.teamId.name;
      })
    : events;

  const filteredAvailabilities = selectedChildId
    ? availabilities.filter(av => {
        const childId = typeof av.childId === 'object' ? av.childId._id : av.childId;
        return childId === selectedChildId;
      })
    : availabilities;

  const availabilitiesForCalendar = filteredAvailabilities.map(av => ({
    eventId: typeof av.eventId === 'object' ? av.eventId._id : av.eventId,
    childId: typeof av.childId === 'object' ? av.childId._id : av.childId,
    status: av.status,
  }));

  const selectedChild = children.find(c => c._id === selectedChildId);

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
            <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
            <button
              onClick={() => router.push('/parent/settings')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Paramètres
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
        {children.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow-md p-4">
            {children.length === 1 ? (
              <div className="text-lg font-semibold text-gray-900">
                Planning de {selectedChild?.name || children[0].name}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un enfant
                </label>
                <select
                  value={selectedChildId || ''}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {children.map(child => (
                    <option key={child._id} value={child._id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Calendar
              events={filteredEvents}
              availabilities={availabilitiesForCalendar}
              onDateClick={handleDateClick}
              onMonthAction={handleMonthAction}
              showMonthActions={true}
            />
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            {selectedDate ? (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-4">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h3>
                {selectedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedEvents.map(event => {
                      if (!selectedChildId) return null;
                      const selectedChild = children.find(c => c._id === selectedChildId);
                      if (!selectedChild) return null;
                      
                      const isRelevant = event.selectedChildrenIds && event.selectedChildrenIds.length > 0
                        ? event.selectedChildrenIds.includes(selectedChildId)
                        : selectedChild.teamId.name === event.teamId.name;
                      
                      if (!isRelevant) return null;

                      const availability = availabilities.find(av => {
                        const avEventId = typeof av.eventId === 'object' ? av.eventId._id : av.eventId;
                        const avChildId = typeof av.childId === 'object' ? av.childId._id : av.childId;
                        return avEventId === event._id && avChildId === selectedChildId;
                      });

                      return (
                        <div key={event._id} className="border-b pb-4 last:border-b-0">
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                              {getEventTypeLabel(event.type)}
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.time} - {event.location}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-sm font-medium">{selectedChild.name}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAvailabilityChange(event._id, 'present')}
                                className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-md hover:opacity-90 active:opacity-80 touch-manipulation min-h-[44px] ${
                                  availability?.status === 'present'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                              >
                                Présent
                              </button>
                              <button
                                onClick={() => handleAvailabilityChange(event._id, 'absent')}
                                className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-md hover:opacity-90 active:opacity-80 touch-manipulation min-h-[44px] ${
                                  availability?.status === 'absent'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucun événement ce jour</p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-gray-500 text-sm">Sélectionnez une date pour voir les événements</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
