import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Availability from '@/models/Availability';
import Child from '@/models/Child';
import Event from '@/models/Event';
import '@/models/User';
import '@/models/Team';
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

    await connectDB();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const childId = searchParams.get('childId');

    let query: any = {};

    // Les parents voient uniquement les disponibilités de leurs enfants (parent 1 ou parent 2)
    if (authUser.role === 'parent') {
      const children = await Child.find({
        $or: [
          { parentId: authUser.userId },
          { parentId2: authUser.userId }
        ]
      });
      const childIds = children.map(c => c._id);
      query.childId = { $in: childIds };
    }

    if (eventId) {
      query.eventId = eventId;
    }

    if (childId) {
      query.childId = childId;
    }

    let availabilities = await Availability.find(query)
      .populate('eventId')
      .populate({ path: 'childId', select: 'name teamId', populate: { path: 'teamId', select: 'name category' } })
      .populate('parentId', 'name email');

    // Exclure les disponibilités orphelines (événement ou enfant supprimé → populate retourne null)
    availabilities = availabilities.filter((av: any) => av.eventId != null && av.childId != null);

    // Pour les éducateurs/admin : filtrer pour ne garder que les enfants de l'équipe de l'événement
    if (eventId && (authUser.role === 'educator' || authUser.role === 'admin')) {
      const event = await Event.findById(eventId).populate('teamId', 'name category');
      if (event?.teamId) {
        const eventTeamId = typeof event.teamId === 'object' ? event.teamId._id : event.teamId;
        availabilities = availabilities.filter((av: any) => {
          const child = av.childId;
          if (!child || typeof child !== 'object') return false;
          const childTeamId = (child as any).teamId;
          const childTeamObj = typeof childTeamId === 'object' ? childTeamId : null;
          if (!childTeamObj) return false;
          const childTeamIdVal = childTeamObj._id || childTeamId;
          return String(childTeamIdVal) === String(eventTeamId);
        });
      }
    }

    return NextResponse.json({ availabilities });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des disponibilités:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'parent') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const { eventId, childId, status, comment } = await request.json();

    if (!eventId || !childId || !status) {
      return NextResponse.json(
        { error: 'Événement, enfant et statut requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'enfant appartient au parent (parent 1 ou parent 2)
    const child = await Child.findOne({
      _id: childId,
      $or: [
        { parentId: authUser.userId },
        { parentId2: authUser.userId }
      ]
    }).populate('teamId');
    if (!child) {
      return NextResponse.json(
        { error: 'Enfant non trouvé ou non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que l'enfant appartient à l'équipe de l'événement
    const event = await Event.findById(eventId).populate('teamId', 'name category');
    if (event?.teamId) {
      const eventTeamId = typeof event.teamId === 'object' ? event.teamId._id?.toString() : event.teamId?.toString();
      const childTeamId = typeof child.teamId === 'object' ? child.teamId._id?.toString() : child.teamId?.toString();
      if (eventTeamId && childTeamId && eventTeamId !== childTeamId) {
        return NextResponse.json(
          { error: "Cet enfant n'appartient pas à l'équipe de cet événement" },
          { status: 400 }
        );
      }
    }

    // Créer ou mettre à jour la disponibilité
    const availability = await Availability.findOneAndUpdate(
      { eventId, childId },
      {
        eventId,
        childId,
        parentId: authUser.userId,
        status,
        comment: comment || '',
      },
      { upsert: true, returnDocument: 'after' }
    );

    const populatedAvailability = await Availability.findById(availability._id)
      .populate('eventId')
      .populate('childId', 'name')
      .populate('parentId', 'name email');

    return NextResponse.json({ availability: populatedAvailability }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création de la disponibilité:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
