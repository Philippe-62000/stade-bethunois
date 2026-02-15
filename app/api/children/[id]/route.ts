import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Child from '@/models/Child';
import '@/models/User';
import '@/models/Team';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'parent')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const child = await Child.findById(id);
    if (!child) {
      return NextResponse.json(
        { error: 'Enfant introuvable' },
        { status: 404 }
      );
    }

    // Un parent ne peut modifier que ses propres enfants
    if (authUser.role === 'parent' && String(child.parentId) !== authUser.userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.teamId !== undefined) updates.teamId = body.teamId;
    if (body.birthDate !== undefined) updates.birthDate = new Date(body.birthDate);
    if (authUser.role === 'admin' && body.parentId !== undefined) updates.parentId = body.parentId;

    const updated = await Child.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate('parentId', 'name email')
      .populate('teamId', 'name category');

    return NextResponse.json({ child: updated });
  } catch (error: any) {
    console.error('Erreur lors de la modification de l\'enfant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
