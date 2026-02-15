import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
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

    // Les parents voient les équipes de leurs enfants, les éducateurs voient leurs équipes, admin voit tout
    let query: any = {};
    if (authUser.role === 'educator') {
      query = { educatorId: authUser.userId };
    }

    const teams = await Team.find(query).populate('educatorId', 'name email');
    return NextResponse.json({ teams });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des équipes:', error);
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

    const { name, category } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Nom et catégorie requis' },
        { status: 400 }
      );
    }

    const team = await Team.create({
      name,
      category,
      educatorId: authUser.userId,
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'équipe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
