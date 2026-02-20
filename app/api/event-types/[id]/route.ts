import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventType from '@/models/EventType';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const eventType = await EventType.findByIdAndDelete(id);
    if (!eventType) {
      return NextResponse.json(
        { error: 'Type d\'événement introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Supprimé' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
