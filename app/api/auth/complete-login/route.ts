import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LoginToken from '@/models/LoginToken';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import { getRolesFromUserDoc, type AppRole } from '@/lib/userRoles';

/**
 * Après un lien magique, si plusieurs rôles : le client envoie le même code + le rôle choisi.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { token, role: requestedRole } = await request.json();

    if (!token || !requestedRole) {
      return NextResponse.json({ error: 'Code et rôle requis' }, { status: 400 });
    }

    const loginToken = await LoginToken.findOne({ token: String(token).trim() });
    if (!loginToken) {
      return NextResponse.json({ error: 'Code invalide ou session expirée. Rechargez le lien.' }, { status: 401 });
    }

    if (new Date() > loginToken.expiresAt) {
      await LoginToken.deleteOne({ _id: loginToken._id });
      return NextResponse.json({ error: 'Lien expiré' }, { status: 401 });
    }

    const user = await User.findById(loginToken.userId);
    if (!user) {
      await LoginToken.deleteOne({ _id: loginToken._id });
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const roles = getRolesFromUserDoc(user.toObject());
    if (!roles.includes(requestedRole as AppRole)) {
      return NextResponse.json({ error: 'Ce rôle n’est pas autorisé pour ce compte' }, { status: 400 });
    }

    await LoginToken.deleteOne({ _id: loginToken._id });

    const activeRole = requestedRole as AppRole;

    const jwt = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: activeRole,
    });

    const response = NextResponse.json(
      {
        message: 'Connexion réussie',
        token: jwt,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: activeRole,
          roles,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('complete-login:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
