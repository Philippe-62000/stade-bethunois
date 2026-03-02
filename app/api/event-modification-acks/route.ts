import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventModificationAck from '@/models/EventModificationAck';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'parent') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const acks = await EventModificationAck.find({ userId: authUser.userId })
      .select('eventId')
      .lean();

    const eventIds = acks.map((a) => String(a.eventId));

    return NextResponse.json({ eventIds });
  } catch (error: any) {
    console.error('Erreur récupération acks:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
