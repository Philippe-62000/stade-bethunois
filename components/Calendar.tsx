'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface CalendarEvent {
  _id: string;
  type: 'training' | 'match' | 'tournament';
  date: string;
  time: string;
  location: string;
  teamId: { _id?: string; name: string; category?: string };
  selectedChildrenIds?: string[] | null;
  isRecurring?: boolean;
  recurringRuleId?: string | null;
}


interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export default function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
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
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
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
          
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={`aspect-square border border-gray-200 rounded-md p-1 md:p-2 cursor-pointer hover:bg-gray-50 active:bg-gray-100 touch-manipulation ${
                isToday ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <div className={`text-xs md:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                {dayEvents.slice(0, 2).map(event => (
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
                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getEventTypeColor(event.type)} ${onEventClick ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 ring-gray-400' : ''}`}
                    title={onEventClick ? `Cliquer pour gérer : ${event.type} à ${event.time}` : `${event.type} à ${event.time}`}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[10px] md:text-xs text-gray-500">+{dayEvents.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
