import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Availability from '@/models/Availability';
import Event from '@/models/Event';
import '@/models/Child';
import '@/models/Team';
import { getAuthUser } from '@/lib/auth';

async function computeCounts(eventIds: string[]) {
  if (eventIds.length === 0) return { counts: {} as Record<string, number> };

  const validIds = eventIds.filter((id) => id && mongoose.Types.ObjectId.isValid(id));
  const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id));

  const counts: Record<string, number> = {};
  for (const eid of validIds) {
    counts[eid] = 0;
  }

  const events = await Event.find({ _id: { $in: objectIds } }).select('teamId').lean();
  const eventTeamMap = new Map<string, string | null>();
  for (const eid of validIds) {
    eventTeamMap.set(eid, null);
  }
  for (const ev of events) {
    const tid = (ev as any).teamId;
    const val = tid ? String(typeof tid === 'object' ? tid._id : tid) : null;
    eventTeamMap.set(String(ev._id), val);
  }

  const availabilities = await Availability.find({
    eventId: { $in: objectIds },
    status: { $in: ['present', 'absent'] },
  })
    .populate({ path: 'childId', select: 'teamId', populate: { path: 'teamId' } })
    .lean();

  const seenPerEvent = new Map<string, Set<string>>();
  for (const eid of validIds) {
    seenPerEvent.set(eid, new Set());
  }

  for (const av of availabilities) {
    const eventIdStr = String((av.eventId as any)?._id ?? (av.eventId as any) ?? av.eventId);
    const child = av.childId as any;
    if (!child) continue;
    const childIdStr = String(child._id ?? child);
    const eventTeamId = eventTeamMap.get(eventIdStr);
    const childTeamIdVal = child.teamId
      ? String(typeof child.teamId === 'object' ? (child.teamId as any)._id : child.teamId)
      : null;
    if (eventTeamId && childTeamIdVal && eventTeamId !== childTeamIdVal) {
      continue;
    }
    const seen = seenPerEvent.get(eventIdStr);
    if (seen && !seen.has(childIdStr)) {
      seen.add(childIdStr);
      counts[eventIdStr] = (counts[eventIdStr] ?? 0) + 1;
    }
  }

  return { counts };
}

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
    const { counts } = await computeCounts(eventIds);
    return NextResponse.json({ counts });
  } catch (error: any) {
    console.error('Erreur GET counts:', error);
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

    const body = await request.json().catch(() => ({}));
    const eventIds = Array.isArray(body.eventIds)
      ? body.eventIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : typeof body.eventIds === 'string'
        ? body.eventIds.split(',').map((id: string) => id.trim()).filter(Boolean)
        : [];

    const { counts } = await computeCounts(eventIds);
    return NextResponse.json({ counts });
  } catch (error: any) {
    console.error('Erreur lors du comptage des disponibilités:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
