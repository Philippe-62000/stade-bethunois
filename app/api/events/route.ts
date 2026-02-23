import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventType from '@/models/EventType';
import '@/models/Team';
import '@/models/Child';
import '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Connexion DB:', dbError);
      return NextResponse.json(
        { error: process.env.MONGODB_URI ? 'Erreur de connexion à la base' : 'Configuration base de données manquante (MONGODB_URI)' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};

    // Les parents voient les événements de leurs enfants (parent 1 ou parent 2)
    if (authUser.role === 'parent') {
      const Child = (await import('@/models/Child')).default;
      const children = await Child.find({
        $or: [
          { parentId: authUser.userId },
          { parentId2: authUser.userId }
        ]
      });
      const childIds = children.map(c => c._id);
      
      query = {
        $or: [
          { selectedChildrenIds: { $in: childIds } },
          { selectedChildrenIds: null, teamId: { $in: children.map(c => c.teamId) } },
        ],
      };
    }
    // Les éducateurs voient les événements de leurs équipes
    else if (authUser.role === 'educator') {
      const Team = (await import('@/models/Team')).default;
      const teams = await Team.find({ educatorId: authUser.userId });
      const teamIds = teams.map(t => t._id);
      query = { teamId: { $in: teamIds } };
    }

    if (teamId) {
      query.teamId = teamId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const events = await Event.find(query)
      .populate('teamId', 'name category')
      .populate('selectedChildrenIds', 'name')
      .populate('createdBy', 'name')
      .sort({ date: 1 });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des événements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || (authUser.role !== 'educator' && authUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const {
      type,
      date,
      time,
      location,
      teamId,
      selectedChildrenIds,
    } = await request.json();

    if (!type || !date || !time || !location || !teamId) {
      return NextResponse.json(
        { error: 'Tous les champs requis sont manquants' },
        { status: 400 }
      );
    }

    const eventTypeDoc = await EventType.findOne({ key: type });
    if (!eventTypeDoc) {
      return NextResponse.json(
        { error: 'Type d\'événement invalide' },
        { status: 400 }
      );
    }

    const event = await Event.create({
      type,
      date: new Date(date),
      time,
      location,
      teamId,
      isRecurring: false,
      recurringRuleId: null,
      isException: false,
      isCustom: true,
      selectedChildrenIds: selectedChildrenIds && selectedChildrenIds.length > 0 ? selectedChildrenIds : null,
      createdBy: authUser.userId,
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('teamId', 'name category')
      .populate('selectedChildrenIds', 'name')
      .populate('createdBy', 'name');

    // Envoyer les notifications si sélection ciblée
    if (selectedChildrenIds && selectedChildrenIds.length > 0) {
      try {
        const Child = (await import('@/models/Child')).default;
        const User = (await import('@/models/User')).default;
        const { sendCreationEmail } = await import('@/lib/emailjs');
        const { format } = await import('date-fns');
        const { fr } = await import('date-fns/locale');

        const children = await Child.find({ _id: { $in: selectedChildrenIds } }).populate('parentId');
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const link = `${baseUrl}/parent/calendar`;
        const eventDate = format(new Date(date), 'dd/MM/yyyy', { locale: fr });

        for (const child of children) {
          const parent = await User.findById((child.parentId as any)._id);
          if (!parent || !parent.notificationSettings?.enabled) continue;

          try {
            await sendCreationEmail({
              parent_name: parent.name,
              child_name: child.name,
              event_type: eventTypeDoc.label,
              event_date: eventDate,
              event_time: time,
              event_location: location,
              link,
            });
          } catch (error) {
            console.error(`Erreur lors de l'envoi de l'email pour ${parent.email}:`, error);
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error);
        // Ne pas faire échouer la création de l'événement si l'email échoue
      }
    }

    return NextResponse.json({ event: populatedEvent }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
