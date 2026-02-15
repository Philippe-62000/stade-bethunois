import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LoginToken from '@/models/LoginToken';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      );
    }

    await connectDB();

    const loginToken = await LoginToken.findOne({ token });
    if (!loginToken) {
      return NextResponse.json(
        { error: 'Lien invalide ou expiré' },
        { status: 401 }
      );
    }

    if (new Date() > loginToken.expiresAt) {
      await LoginToken.deleteOne({ _id: loginToken._id });
      return NextResponse.json(
        { error: 'Lien expiré' },
        { status: 401 }
      );
    }

    const user = await User.findById(loginToken.userId);
    if (!user) {
      await LoginToken.deleteOne({ _id: loginToken._id });
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Supprimer le token (usage unique)
    await LoginToken.deleteOne({ _id: loginToken._id });

    const jwt = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: 'Connexion réussie',
        token: jwt,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Erreur login-by-token:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
