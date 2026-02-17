'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import { format } from 'date-fns';
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

export default function ParentCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, childrenRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/children'),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        setChildren(childrenData.children || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    setSelectedEvents(dayEvents);
  };

  const handleAvailabilityChange = async (eventId: string, childId: string, status: 'present' | 'absent') => {
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
        // Rafraîchir les données
        fetchData();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Calendar events={events} onDateClick={handleDateClick} />
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
                      const relevantChildren = children.filter(child => {
                        if (event.selectedChildrenIds && event.selectedChildrenIds.length > 0) {
                          return event.selectedChildrenIds.includes(child._id);
                        }
                        return child.teamId.name === event.teamId.name;
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
                          {relevantChildren.map(child => (
                            <div key={child._id} className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="text-sm font-medium">{child.name}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAvailabilityChange(event._id, child._id, 'present')}
                                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 active:bg-green-300 touch-manipulation min-h-[44px]"
                                >
                                  Présent
                                </button>
                                <button
                                  onClick={() => handleAvailabilityChange(event._id, child._id, 'absent')}
                                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 active:bg-red-300 touch-manipulation min-h-[44px]"
                                >
                                  Absent
                                </button>
                              </div>
                            </div>
                          ))}
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
