import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventModificationAck from '@/models/EventModificationAck';
import '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'parent') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;

    await connectDB();

    await EventModificationAck.findOneAndUpdate(
      { eventId, userId: authUser.userId },
      { eventId, userId: authUser.userId },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur ack modification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
