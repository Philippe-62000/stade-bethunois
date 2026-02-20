import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventType from '@/models/EventType';
import { getAuthUser } from '@/lib/auth';

const DEFAULT_EVENT_TYPES = [
  { key: 'training', label: 'Entraînement', order: 0 },
  { key: 'match', label: 'Match', order: 1 },
  { key: 'tournament', label: 'Tournoi', order: 2 },
];

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

    let eventTypes = await EventType.find({}).sort({ order: 1, label: 1 }).lean();

    if (eventTypes.length === 0) {
      await EventType.insertMany(DEFAULT_EVENT_TYPES);
      eventTypes = await EventType.find({}).sort({ order: 1, label: 1 }).lean();
    }

    return NextResponse.json({ eventTypes });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des types d\'événements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const { label } = await request.json();
    const trimmedLabel = typeof label === 'string' ? label.trim() : '';

    if (!trimmedLabel) {
      return NextResponse.json(
        { error: 'Le libellé est requis' },
        { status: 400 }
      );
    }

    const key = trimmedLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'event';

    const existing = await EventType.findOne({
      $or: [
        { key },
        { label: { $regex: new RegExp(`^${trimmedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Ce type d\'événement existe déjà' },
        { status: 400 }
      );
    }

    const count = await EventType.countDocuments();
    const eventType = await EventType.create({
      key,
      label: trimmedLabel,
      order: count,
    });

    return NextResponse.json({ eventType }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du type d\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
