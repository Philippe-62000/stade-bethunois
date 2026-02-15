import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { getAuthUser } from '@/lib/auth';

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
