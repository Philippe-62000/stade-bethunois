import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Availability from '@/models/Availability';
import Child from '@/models/Child';
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

    // Les parents voient uniquement les disponibilités de leurs enfants
    if (authUser.role === 'parent') {
      const children = await Child.find({ parentId: authUser.userId });
      const childIds = children.map(c => c._id);
      query.childId = { $in: childIds };
    }

    if (eventId) {
      query.eventId = eventId;
    }

    if (childId) {
      query.childId = childId;
    }

    const availabilities = await Availability.find(query)
      .populate('eventId')
      .populate('childId', 'name')
      .populate('parentId', 'name email');

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

    // Vérifier que l'enfant appartient au parent
    const child = await Child.findOne({ _id: childId, parentId: authUser.userId });
    if (!child) {
      return NextResponse.json(
        { error: 'Enfant non trouvé ou non autorisé' },
        { status: 403 }
      );
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
      { upsert: true, new: true }
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
