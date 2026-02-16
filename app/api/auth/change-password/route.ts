import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();

    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Pour les parents avec code provisoire, on peut changer sans vérifier l'ancien mot de passe
    // Sinon, vérifier l'ancien mot de passe
    if (currentPassword) {
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le mot de passe
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la modification du mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
