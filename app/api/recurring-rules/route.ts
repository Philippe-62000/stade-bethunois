import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RecurringRule from '@/models/RecurringRule';
import Event from '@/models/Event';
import EventType from '@/models/EventType';
import '@/models/Team';
import '@/models/Child';
import '@/models/User';
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

    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Connexion DB:', dbError);
      return NextResponse.json(
        { error: process.env.MONGODB_URI ? 'Erreur de connexion à la base' : 'Configuration base de données manquante (MONGODB_URI)' },
        { status: 500 }
      );
    }

    const {
      type,
      dayOfWeek,
      time,
      endTime,
      teamId: bodyTeamId,
      teamIds: bodyTeamIds,
      location,
      startDate,
      endDate,
      periodType,
      selectedChildrenIds,
    } = await request.json();

    const teamIdsArray = Array.isArray(bodyTeamIds) && bodyTeamIds.length > 0
      ? bodyTeamIds
      : bodyTeamId
        ? [bodyTeamId]
        : [];

    if (!type || dayOfWeek === undefined || !time || !location || !startDate || !periodType || teamIdsArray.length === 0) {
      return NextResponse.json(
        { error: 'Tous les champs requis sont manquants (dont au moins une équipe)' },
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

    const startDateObj = new Date(startDate);
    const endDateObj = endDate ? new Date(endDate) : null;
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Date de début invalide' },
        { status: 400 }
      );
    }
    if (periodType === 'seasonal') {
      if (!endDate || !endDate.trim()) {
        return NextResponse.json(
          { error: 'Une récurrence saisonnière doit avoir une date de fin' },
          { status: 400 }
        );
      }
      if (isNaN(endDateObj!.getTime())) {
        return NextResponse.json(
          { error: 'Date de fin invalide' },
          { status: 400 }
        );
      }
    }

    let dates: Date[];
    try {
      dates = generateEventDates({
        dayOfWeek: parseInt(dayOfWeek),
        time,
        startDate: startDateObj,
        endDate: endDateObj,
        periodType,
      });
    } catch (err: any) {
      console.error('generateEventDates error:', err);
      return NextResponse.json(
        { error: err?.message || 'Erreur lors de la génération des dates' },
        { status: 400 }
      );
    }

    const createdRules: any[] = [];
    let totalEventsCreated = 0;

    for (const teamId of teamIdsArray) {
      const rule = await RecurringRule.create({
        type,
        dayOfWeek: parseInt(dayOfWeek),
        time,
        ...(endTime && { endTime }),
        teamId,
        location,
        startDate: startDateObj,
        endDate: endDateObj,
        periodType,
        selectedChildrenIds: selectedChildrenIds && selectedChildrenIds.length > 0 ? selectedChildrenIds : null,
      });

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
      totalEventsCreated += events.length;

      const populatedRule = await RecurringRule.findById(rule._id)
        .populate('teamId', 'name category')
        .populate('selectedChildrenIds', 'name');
      createdRules.push(populatedRule);
    }

    return NextResponse.json(
      { rules: createdRules, eventsCreated: totalEventsCreated },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création de la règle:', error);
    const message = error?.message || 'Erreur serveur';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
