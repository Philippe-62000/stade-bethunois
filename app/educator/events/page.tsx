'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Calendar, { type CalendarEvent } from '@/components/Calendar';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Team {
  _id: string;
  name: string;
  category: string;
}

interface Child {
  _id: string;
  name: string;
  teamId: string;
}

export default function EducatorEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [places, setPlaces] = useState<{ _id: string; name: string }[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRecurrenceForm, setShowRecurrenceForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [dayEventsList, setDayEventsList] = useState<CalendarEvent[]>([]);
  const [selectedEventForDelete, setSelectedEventForDelete] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, teamsRes, placesRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/teams'),
        fetch('/api/places'),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
      }

      if (placesRes.ok) {
        const placesData = await placesRes.json();
        setPlaces(placesData.places || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));
    if (dayEvents.length > 0) {
      setDayEventsList(dayEvents);
      setShowDayEventsModal(true);
    } else {
      setShowCreateForm(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventForDelete(event);
  };

  const handleDeleteEvent = async (scope: 'this' | 'future') => {
    if (!selectedEventForDelete) return;
    try {
      const res = await fetch(`/api/events/${selectedEventForDelete._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scope }),
      });
      if (res.ok) {
        fetchData();
        setSelectedEventForDelete(null);
        setShowDayEventsModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTeamChange = async (teamId: string) => {
    try {
      const response = await fetch(`/api/children?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des événements</h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => router.push('/educator/teams')}
                className="w-full sm:w-auto px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 active:bg-gray-800 touch-manipulation min-h-[44px]"
              >
                Équipes
              </button>
              <button
                onClick={() => setShowRecurrenceForm(true)}
                className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 touch-manipulation min-h-[44px]"
              >
                Nouvelle récurrence
              </button>
              <button
                onClick={() => router.push('/educator/availabilities')}
                className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 touch-manipulation min-h-[44px]"
              >
                Voir les présences
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Calendar events={events} onDateClick={handleDateClick} onEventClick={handleEventClick} />
      </div>

      {showCreateForm && (
        <CreateEventForm
          teams={teams}
          children={children}
          selectedDate={selectedDate}
          onTeamChange={handleTeamChange}
          onClose={() => {
            setShowCreateForm(false);
            setSelectedDate(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowCreateForm(false);
            setSelectedDate(null);
          }}
        />
      )}

      {showRecurrenceForm && (
        <CreateRecurrenceForm
          teams={teams}
          places={places}
          children={children}
          onTeamChange={handleTeamChange}
          onClose={() => setShowRecurrenceForm(false)}
          onSuccess={() => {
            fetchData();
            setShowRecurrenceForm(false);
          }}
        />
      )}

      {showDayEventsModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              Événements du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </h2>
            <ul className="space-y-2 mb-4">
              {dayEventsList.map(ev => (
                <li key={ev._id}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDayEventsModal(false);
                      setSelectedEventForDelete(ev);
                    }}
                    className="w-full text-left px-3 py-2 rounded border border-gray-200 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <span>
                      {ev.type === 'training' ? 'Entraînement' : ev.type === 'match' ? 'Match' : 'Tournoi'} — {ev.time}
                      {ev.teamId?.name && ` (${ev.teamId.name})`}
                    </span>
                    <span className="text-gray-500 text-sm">Supprimer</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDayEventsModal(false);
                  setShowCreateForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Créer un événement
              </button>
              <button
                type="button"
                onClick={() => setShowDayEventsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEventForDelete && !showDayEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Supprimer cet événement ?</h2>
            <p className="text-gray-600 mb-4">
              {selectedEventForDelete.type === 'training' ? 'Entraînement' : selectedEventForDelete.type === 'match' ? 'Match' : 'Tournoi'} — {format(new Date(selectedEventForDelete.date), 'dd/MM/yyyy', { locale: fr })} à {selectedEventForDelete.time}
              {selectedEventForDelete.teamId?.name && ` (${selectedEventForDelete.teamId.name})`}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleDeleteEvent('this')}
                className="w-full px-4 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700"
              >
                Effacer cette journée uniquement
              </button>
              {selectedEventForDelete.isRecurring && (
                <button
                  type="button"
                  onClick={() => handleDeleteEvent('future')}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Effacer toutes les récurrences à partir de cette date
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedEventForDelete(null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateEventForm({
  teams,
  children,
  selectedDate,
  onTeamChange,
  onClose,
  onSuccess,
}: {
  teams: Team[];
  children: Child[];
  selectedDate: Date | null;
  onTeamChange: (teamId: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'training' as 'training' | 'match' | 'tournament',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: '18:00',
    location: '',
    teamId: '',
    selectedChildrenIds: [] as string[],
    selectAll: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          selectedChildrenIds: formData.selectAll ? null : formData.selectedChildrenIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la création');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Nouvel événement</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="training">Entraînement</option>
              <option value="match">Match</option>
              <option value="tournament">Tournoi</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lieu
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Équipe
            </label>
            <select
              value={formData.teamId}
              onChange={(e) => {
                setFormData({ ...formData, teamId: e.target.value, selectedChildrenIds: [] });
                onTeamChange(e.target.value);
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Sélectionner une équipe</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name} ({team.category})
                </option>
              ))}
            </select>
          </div>

          {formData.teamId && children.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joueurs concernés
              </label>
              <div className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectAll}
                    onChange={(e) => setFormData({ ...formData, selectAll: e.target.checked, selectedChildrenIds: [] })}
                    className="mr-2"
                  />
                  <span className="text-sm">Tous les joueurs de l'équipe</span>
                </label>
              </div>
              {!formData.selectAll && (
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                  {children.map(child => (
                    <label key={child._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.selectedChildrenIds.includes(child._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              selectedChildrenIds: [...formData.selectedChildrenIds, child._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              selectedChildrenIds: formData.selectedChildrenIds.filter(id => id !== child._id),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{child.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 touch-manipulation min-h-[44px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 touch-manipulation min-h-[44px]"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateRecurrenceForm({
  teams,
  places,
  children,
  onTeamChange,
  onClose,
  onSuccess,
}: {
  teams: Team[];
  places: { _id: string; name: string }[];
  children: Child[];
  onTeamChange: (teamId: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'training' as 'training' | 'match' | 'tournament',
    dayOfWeek: '1',
    time: '18:00',
    endTime: '',
    location: '',
    teamIds: [] as string[],
    selectAllTeams: false,
    periodType: 'seasonal' as 'monthly' | 'seasonal' | 'continuous',
    startDate: '',
    endDate: '',
    selectedMonth: '',
    selectedChildrenIds: [] as string[],
    selectAll: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialiser les dates pour la saison (septembre à juin)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Si on est avant septembre, utiliser l'année précédente pour septembre
    const septemberYear = currentMonth < 8 ? currentYear - 1 : currentYear;
    const juneYear = currentMonth < 8 ? currentYear : currentYear + 1;
    
    setFormData(prev => ({
      ...prev,
      startDate: `${septemberYear}-09-01`,
      endDate: `${juneYear}-06-30`,
    }));
  }, []);

  // Charger les enfants quand une seule équipe est sélectionnée
  useEffect(() => {
    if (formData.teamIds.length === 1 && !formData.selectAllTeams) {
      onTeamChange(formData.teamIds[0]);
    }
  }, [formData.teamIds, formData.selectAllTeams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let startDate = formData.startDate;
      let endDate = formData.endDate;

      if (formData.periodType === 'monthly') {
        if (!formData.selectedMonth) {
          setError('Veuillez sélectionner un mois');
          return;
        }
        startDate = `${formData.selectedMonth}-01`;
        const monthDate = new Date(startDate);
        monthDate.setMonth(monthDate.getMonth() + 1);
        monthDate.setDate(0);
        endDate = format(monthDate, 'yyyy-MM-dd');
      } else if (formData.periodType === 'continuous') {
        endDate = '';
      }

      const teamIdsToSend = formData.selectAllTeams
        ? teams.map((t) => t._id)
        : formData.teamIds;
      if (teamIdsToSend.length === 0) {
        setError('Sélectionnez au moins une équipe.');
        setLoading(false);
        return;
      }
      if (!formData.location.trim()) {
        setError('Sélectionnez ou saisissez un lieu.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/recurring-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          dayOfWeek: parseInt(formData.dayOfWeek),
          time: formData.time,
          endTime: formData.endTime || undefined,
          location: formData.location.trim(),
          teamIds: teamIdsToSend,
          periodType: formData.periodType,
          startDate,
          endDate: endDate || null,
          selectedChildrenIds:
            teamIdsToSend.length === 1 && !formData.selectAll
              ? formData.selectedChildrenIds
              : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la création');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { value: '0', label: 'Dimanche' },
    { value: '1', label: 'Lundi' },
    { value: '2', label: 'Mardi' },
    { value: '3', label: 'Mercredi' },
    { value: '4', label: 'Jeudi' },
    { value: '5', label: 'Vendredi' },
    { value: '6', label: 'Samedi' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 my-auto">
        <h2 className="text-xl font-bold mb-4">Nouvelle récurrence</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="training">Entraînement</option>
              <option value="match">Match</option>
              <option value="tournament">Tournoi</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jour de la semaine
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {weekDays.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de début
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de fin (optionnel)
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md max-w-[10rem]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lieu
            </label>
            {places.length === 0 ? (
              <div className="space-y-2">
                <p className="text-amber-700 text-sm">
                  Aucun lieu défini. Définissez des lieux dans{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/admin/settings')}
                    className="underline font-medium hover:no-underline"
                  >
                    Paramètres
                  </button>
                  , ou saisissez ci-dessous :
                </p>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex. Terrain 1, 8 Ter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            ) : (
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Choisir un lieu</option>
                {places.map((place) => (
                  <option key={place._id} value={place.name}>
                    {place.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Équipe(s)
            </label>
            {teams.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                Aucune équipe. Créez-en une dans la page{' '}
                <button
                  type="button"
                  onClick={() => router.push('/educator/teams')}
                  className="underline font-medium hover:no-underline"
                >
                  Équipes
                </button>
                .
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectAllTeams}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        selectAllTeams: checked,
                        teamIds: checked ? teams.map((t) => t._id) : [],
                        selectedChildrenIds: [],
                      });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Toutes les équipes</span>
                </label>
                {!formData.selectAllTeams && (
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                    {teams.map((team) => (
                      <label key={team._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.teamIds.includes(team._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const next = [...formData.teamIds, team._id];
                              setFormData({
                                ...formData,
                                teamIds: next,
                                selectedChildrenIds: next.length === 1 ? formData.selectedChildrenIds : [],
                              });
                              if (next.length === 1) onTeamChange(next[0]);
                            } else {
                              const next = formData.teamIds.filter((id) => id !== team._id);
                              setFormData({
                                ...formData,
                                teamIds: next,
                                selectedChildrenIds: next.length === 1 ? formData.selectedChildrenIds : [],
                              });
                              if (next.length === 1) onTeamChange(next[0]);
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{team.name} ({team.category})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="periodType"
                  value="monthly"
                  checked={formData.periodType === 'monthly'}
                  onChange={(e) => setFormData({ ...formData, periodType: e.target.value as any })}
                  className="mr-2"
                />
                <span className="text-sm">Mensuelle</span>
              </label>
              {formData.periodType === 'monthly' && (
                <input
                  type="month"
                  value={formData.selectedMonth}
                  onChange={(e) => setFormData({ ...formData, selectedMonth: e.target.value })}
                  className="ml-6 px-3 py-2 border border-gray-300 rounded-md"
                />
              )}

              <label className="flex items-center">
                <input
                  type="radio"
                  name="periodType"
                  value="seasonal"
                  checked={formData.periodType === 'seasonal'}
                  onChange={(e) => setFormData({ ...formData, periodType: e.target.value as any })}
                  className="mr-2"
                />
                <span className="text-sm">Saisonnière (septembre à juin)</span>
              </label>
              {formData.periodType === 'seasonal' && (
                <div className="ml-6 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">De</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">À</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center">
                <input
                  type="radio"
                  name="periodType"
                  value="continuous"
                  checked={formData.periodType === 'continuous'}
                  onChange={(e) => setFormData({ ...formData, periodType: e.target.value as any })}
                  className="mr-2"
                />
                <span className="text-sm">Continue (sans fin)</span>
              </label>
            </div>
          </div>

          {formData.teamIds.length === 1 && !formData.selectAllTeams && children.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joueurs concernés
              </label>
              <div className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectAll}
                    onChange={(e) => setFormData({ ...formData, selectAll: e.target.checked, selectedChildrenIds: [] })}
                    className="mr-2"
                  />
                  <span className="text-sm">Tous les joueurs de l&apos;équipe</span>
                </label>
              </div>
              {!formData.selectAll && (
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                  {children.map(child => (
                    <label key={child._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.selectedChildrenIds.includes(child._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              selectedChildrenIds: [...formData.selectedChildrenIds, child._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              selectedChildrenIds: formData.selectedChildrenIds.filter(id => id !== child._id),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{child.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 touch-manipulation min-h-[44px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                teams.length === 0 ||
                (!formData.selectAllTeams && formData.teamIds.length === 0) ||
                !formData.location.trim()
              }
              className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 disabled:opacity-50 touch-manipulation min-h-[44px]"
            >
              {loading ? 'Création...' : 'Créer la récurrence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
