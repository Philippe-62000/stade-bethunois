import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventType from '@/models/EventType';
import Availability from '@/models/Availability';
import Child from '@/models/Child';
import User from '@/models/User';
import { sendReminderEmail } from '@/lib/emailjs';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const REMINDER_HOUR = parseInt(process.env.REMINDER_HOUR || '8');
const REMINDER_DAYS_BEFORE = parseInt(process.env.REMINDER_DAYS_BEFORE || '2');
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Vérifier le secret pour sécuriser l'endpoint
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    // Calculer la date cible (REMINDER_DAYS_BEFORE jours à partir d'aujourd'hui)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = addDays(today, REMINDER_DAYS_BEFORE);
    targetDate.setHours(23, 59, 59, 999);

    // Trouver tous les événements à la date cible
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await Event.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate('teamId', 'name');

    let emailsSent = 0;
    let errors = 0;

    for (const event of events) {
      // Déterminer les enfants concernés
      let childrenIds: string[] = [];

      if (event.selectedChildrenIds && event.selectedChildrenIds.length > 0) {
        // Sélection ciblée
        childrenIds = event.selectedChildrenIds.map((id: any) => id.toString());
      } else {
        // Tous les enfants de l'équipe
        const children = await Child.find({ teamId: event.teamId._id });
        childrenIds = children.map(c => c._id.toString());
      }

      // Pour chaque enfant, vérifier s'il a répondu
      for (const childId of childrenIds) {
        const availability = await Availability.findOne({
          eventId: event._id,
          childId,
        });

        // Si pas de réponse ou statut "pending"
        if (!availability || availability.status === 'pending') {
          // Récupérer l'enfant et le parent
          const child = await Child.findById(childId).populate('parentId');
          if (!child || !child.parentId) continue;

          const parent = await User.findById((child.parentId as any)._id);
          if (!parent) continue;

          // Vérifier si les rappels sont activés
          if (!parent.notificationSettings?.reminderEnabled) {
            continue;
          }

          // Préparer les données pour l'email
          const eventDate = format(new Date(event.date), 'dd/MM/yyyy', { locale: fr });
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const link = `${baseUrl}/parent/calendar`;

          try {
            const eventTypeDoc = await EventType.findOne({ key: event.type });
            const eventTypeLabel = eventTypeDoc?.label ?? event.type;
            await sendReminderEmail({
              parent_name: parent.name,
              child_name: child.name,
              event_type: eventTypeLabel,
              event_date: eventDate,
              event_time: event.time,
              event_location: event.location,
              link,
            });

            emailsSent++;
          } catch (error) {
            console.error(`Erreur lors de l'envoi de l'email pour ${parent.email}:`, error);
            errors++;
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Rappels envoyés',
      targetDate: format(targetDate, 'dd/MM/yyyy', { locale: fr }),
      eventsProcessed: events.length,
      emailsSent,
      errors,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi des rappels:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
