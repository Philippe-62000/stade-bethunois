import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RecurringRule from '@/models/RecurringRule';
import Event from '@/models/Event';
import { getAuthUser } from '@/lib/auth';
import { generateEventDates } from '@/lib/recurrence';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || (authUser.role !== 'educator' && authUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    let query: any = {};
    if (authUser.role === 'educator') {
      // Récupérer les équipes de l'éducateur
      const Team = (await import('@/models/Team')).default;
      const teams = await Team.find({ educatorId: authUser.userId });
      const teamIds = teams.map(t => t._id);
      query = { teamId: { $in: teamIds } };
    }

    const rules = await RecurringRule.find(query)
      .populate('teamId', 'name category')
      .populate('selectedChildrenIds', 'name');
    
    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des règles:', error);
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
      dayOfWeek,
      time,
      endTime,
      teamId,
      location,
      startDate,
      endDate,
      periodType,
      selectedChildrenIds,
    } = await request.json();

    if (!type || dayOfWeek === undefined || !time || !teamId || !location || !startDate || !periodType) {
      return NextResponse.json(
        { error: 'Tous les champs requis sont manquants' },
        { status: 400 }
      );
    }

    // Créer la règle de récurrence
    const rule = await RecurringRule.create({
      type,
      dayOfWeek: parseInt(dayOfWeek),
      time,
      ...(endTime && { endTime }),
      teamId,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      periodType,
      selectedChildrenIds: selectedChildrenIds && selectedChildrenIds.length > 0 ? selectedChildrenIds : null,
    });

    // Générer les événements
    const dates = generateEventDates({
      dayOfWeek: parseInt(dayOfWeek),
      time,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      periodType,
    });

    // Créer les événements
    const events = dates.map(date => ({
      type,
      date,
      time,
      ...(endTime && { endTime }),
      location,
      teamId,
      isRecurring: true,
      recurringRuleId: rule._id,
      isException: false,
      isCustom: false,
      selectedChildrenIds: selectedChildrenIds && selectedChildrenIds.length > 0 ? selectedChildrenIds : null,
      createdBy: authUser.userId,
    }));

    await Event.insertMany(events);

    const populatedRule = await RecurringRule.findById(rule._id)
      .populate('teamId', 'name category')
      .populate('selectedChildrenIds', 'name');

    return NextResponse.json(
      { rule: populatedRule, eventsCreated: events.length },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création de la règle:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
