import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Child from '@/models/Child';
import '@/models/User';
import '@/models/Team';
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

    let query: any = {};
    
    // Les parents voient uniquement leurs enfants
    if (authUser.role === 'parent') {
      query = { parentId: authUser.userId };
    }
    // Les éducateurs voient les enfants de leurs équipes
    else if (authUser.role === 'educator') {
      const { searchParams } = new URL(request.url);
      const teamId = searchParams.get('teamId');
      if (teamId) {
        query = { teamId };
      }
    }
    // Admin voit tout (pas de filtre)

    const children = await Child.find(query)
      .populate('parentId', 'name email')
      .populate('teamId', 'name category');
    
    return NextResponse.json({ children });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des enfants:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || (authUser.role !== 'parent' && authUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, teamId, birthDate, parentId: bodyParentId } = body;

    if (!name || !teamId || !birthDate) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const parentId = authUser.role === 'parent' ? authUser.userId : bodyParentId;
    if (!parentId) {
      return NextResponse.json(
        { error: 'parentId requis (admin doit indiquer le parent)' },
        { status: 400 }
      );
    }

    const child = await Child.create({
      name,
      teamId,
      parentId,
      birthDate: new Date(birthDate),
    });

    const populatedChild = await Child.findById(child._id)
      .populate('parentId', 'name email')
      .populate('teamId', 'name category');

    return NextResponse.json({ child: populatedChild }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'enfant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
