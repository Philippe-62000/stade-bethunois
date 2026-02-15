import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Place from '@/models/Place';
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

    const places = await Place.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ places });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des lieux:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const { name } = await request.json();
    const trimmed = typeof name === 'string' ? name.trim() : '';

    if (!trimmed) {
      return NextResponse.json(
        { error: 'Le nom du lieu est requis' },
        { status: 400 }
      );
    }

    const existing = await Place.findOne({ name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ce lieu existe déjà' },
        { status: 400 }
      );
    }

    const place = await Place.create({ name: trimmed });
    return NextResponse.json({ place }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du lieu:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
