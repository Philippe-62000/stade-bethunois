import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import '@/models/User';
import User from '@/models/User';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nom et email requis' },
        { status: 400 }
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== id) {
        return NextResponse.json(
          { error: `L'email ${email} est déjà utilisé` },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    user.name = name;
    user.email = email.toLowerCase();
    if (role && ['parent', 'educator', 'admin'].includes(role)) {
      user.role = role;
    }
    await user.save();

    return NextResponse.json({
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Ne pas permettre de supprimer son propre compte
    if (authUser.userId === id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il reste au moins un admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (user.role === 'admin' && adminCount <= 1) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le dernier administrateur' },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
