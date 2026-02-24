import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Availability from '@/models/Availability';
import { getAuthUser } from '@/lib/auth';

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

    const { searchParams } = new URL(request.url);
    const eventIdsParam = searchParams.get('eventIds');
    if (!eventIdsParam) {
      return NextResponse.json(
        { error: 'eventIds requis (séparés par des virgules)' },
        { status: 400 }
      );
    }

    const eventIds = eventIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
    if (eventIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    const objectIds = eventIds.map((id) => new mongoose.Types.ObjectId(id));
    const results = await Availability.aggregate([
      { $match: { eventId: { $in: objectIds }, status: { $in: ['present', 'absent'] } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r._id.toString()] = r.count;
    }
    for (const eid of eventIds) {
      if (!(eid in counts)) counts[eid] = 0;
    }

    return NextResponse.json({ counts });
  } catch (error: any) {
    console.error('Erreur lors du comptage des disponibilités:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
