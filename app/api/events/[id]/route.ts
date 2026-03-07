import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventType from '@/models/EventType';
import '@/models/Team';
import '@/models/Child';
import '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || (authUser.role !== 'educator' && authUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      );
    }

    const { type, date, time, location, cancelled } = body;

    const modifiedFields: { time?: boolean; location?: boolean; type?: boolean } = {};

    if (cancelled === true) {
      event.cancelled = true;
    }

    if (type !== undefined) {
      const eventTypeDoc = await EventType.findOne({ key: type });
      if (!eventTypeDoc) {
        return NextResponse.json(
          { error: "Type d'événement invalide" },
          { status: 400 }
        );
      }
      modifiedFields.type = event.type !== type;
      event.type = type;
    }
    if (date !== undefined) {
      event.date = new Date(date);
    }
    if (time !== undefined) {
      modifiedFields.time = event.time !== time;
      event.time = time;
    }
    if (location !== undefined) {
      modifiedFields.location = event.location !== location;
      event.location = location;
    }

    const hasModifications = Object.values(modifiedFields).some(Boolean);
    if (hasModifications) {
      event.modifiedFields = {
        ...(event.modifiedFields || {}),
        ...modifiedFields,
      };
    }

    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('teamId', 'name category')
      .populate('selectedChildrenIds', 'name')
      .populate('createdBy', 'name');

    return NextResponse.json({ event: populatedEvent });
  } catch (error: any) {
    console.error('Erreur lors de la modification de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || (authUser.role !== 'educator' && authUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const scope: 'this' | 'future' = body.scope === 'future' ? 'future' : 'this';

    await connectDB();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      );
    }

    if (scope === 'this') {
      await Event.findByIdAndDelete(id);
      return NextResponse.json({ deleted: 1, scope: 'this' });
    }

    // scope === 'future' : supprimer cet événement et tous les suivants de la même récurrence
    if (!event.recurringRuleId) {
      await Event.findByIdAndDelete(id);
      return NextResponse.json({ deleted: 1, scope: 'this' });
    }

    const eventDate = new Date(event.date);
    const delThis = await Event.deleteOne({ _id: id });
    const delFuture = await Event.deleteMany({
      recurringRuleId: event.recurringRuleId,
      date: { $gt: eventDate },
    });

    return NextResponse.json({
      deleted: delThis.deletedCount + delFuture.deletedCount,
      scope: 'future',
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
