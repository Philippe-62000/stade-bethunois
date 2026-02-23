'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface CalendarEvent {
  _id: string;
  type: string;
  date: string;
  time: string;
  location: string;
  teamId: { _id?: string; name: string; category?: string };
  selectedChildrenIds?: Array<string | { _id: string; name?: string }> | null;
  isRecurring?: boolean;
  recurringRuleId?: string | null;
}


interface AvailabilityStatus {
  eventId: string;
  childId: string;
  status: 'present' | 'absent' | 'pending';
}

interface CalendarProps {
  events: CalendarEvent[];
  availabilities?: AvailabilityStatus[];
  selectedDate?: Date | null;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onMonthAction?: (month: Date, status: 'present' | 'absent') => void;
  showMonthActions?: boolean;
}

export default function Calendar({ events, availabilities = [], selectedDate = null, onDateClick, onEventClick, onMonthAction, showMonthActions = false }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthButtons, setShowMonthButtons] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getDayStatus = (date: Date): 'present' | 'absent' | 'pending' | null => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;
    
    const dayAvailabilities = availabilities.filter(av => {
      return dayEvents.some(ev => ev._id === av.eventId);
    });
    
    if (dayAvailabilities.length === 0) return 'pending';
    
    const hasPresent = dayAvailabilities.some(av => av.status === 'present');
    const hasAbsent = dayAvailabilities.some(av => av.status === 'absent');
    const allAbsent = dayAvailabilities.length > 0 && dayAvailabilities.every(av => av.status === 'absent');
    
    if (hasPresent) return 'present';
    if (allAbsent) return 'absent';
    return 'pending';
  };

  const handleMonthClick = () => {
    if (showMonthActions || onMonthAction) {
      setShowMonthButtons(!showMonthButtons);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'bg-blue-500';
      case 'match':
        return 'bg-green-500';
      case 'tournament':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Ajuster le premier jour du mois pour commencer le calendrier correctement
  const firstDayOfWeek = getDay(monthStart);
  const emptyDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              setCurrentMonth(subMonths(currentMonth, 1));
              setShowMonthButtons(false);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ←
          </button>
          <button
            onClick={handleMonthClick}
            className={`text-xl font-bold px-3 py-1 rounded-md text-gray-900 dark:text-gray-100 ${showMonthActions || onMonthAction ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}`}
          >
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </button>
          <button
            onClick={() => {
              setCurrentMonth(addMonths(currentMonth, 1));
              setShowMonthButtons(false);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            →
          </button>
        </div>
        {showMonthButtons && (showMonthActions || onMonthAction) && (
          <div className="flex justify-center gap-2 mt-3">
            <button
              onClick={() => {
                onMonthAction?.(currentMonth, 'present');
                setShowMonthButtons(false);
              }}
              className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 font-medium"
            >
              Présent à tous les événements du mois
            </button>
            <button
              onClick={() => {
                onMonthAction?.(currentMonth, 'absent');
                setShowMonthButtons(false);
              }}
              className="px-4 py-2 text-sm bg-pink-100 text-pink-800 rounded-md hover:bg-pink-200 font-medium"
            >
              Absent à tous les événements du mois
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}
        {daysInMonth.map(day => {
          const dayEvents = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dayStatus = getDayStatus(day);
          
          let bgColor = '';
          if (isSelected) {
            bgColor = 'bg-gray-200 border-gray-400';
          } else if (dayStatus === 'present') {
            bgColor = 'bg-green-100 border-green-300';
          } else if (dayStatus === 'absent') {
            bgColor = 'bg-pink-100 border-pink-300';
          } else if (dayStatus === 'pending' && dayEvents.length > 0) {
            bgColor = 'bg-white border-gray-200';
          } else {
            bgColor = isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200';
          }
          
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={`aspect-square border rounded-md p-1 md:p-2 cursor-pointer hover:opacity-80 active:opacity-70 touch-manipulation ${bgColor} ${
                isToday && dayStatus === null ? 'border-blue-300' : ''
              }`}
            >
              <div className={`text-xs md:text-sm font-medium ${isSelected ? 'text-gray-900 font-semibold' : isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                {dayEvents.slice(0, 5).map(event => (
                  <div
                    key={event._id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onEventClick?.(event);
                      }
                    }}
                    className={`w-[10px] h-[10px] md:w-5 md:h-5 rounded-full touch-manipulation ${getEventTypeColor(event.type)} ${onEventClick ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 ring-gray-400' : ''}`}
                    title={onEventClick ? `Cliquer pour gérer : ${event.type} à ${event.time}` : `${event.type} à ${event.time}`}
                  />
                ))}
                {dayEvents.length > 5 && (
                  <span className="text-[10px] md:text-xs text-gray-500">+{dayEvents.length - 5}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
