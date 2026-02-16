import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import '@/models/User';
import User from '@/models/User';
import '@/models/LoginToken';
import LoginToken from '@/models/LoginToken';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password, code } = await request.json();

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    if (!password && !code) {
      return NextResponse.json(
        { error: 'Mot de passe ou code requis' },
        { status: 400 }
      );
    }

    // Normaliser l'email (minuscules) comme en base
    const emailNormalized = String(email).trim().toLowerCase();

    // Trouver l'utilisateur
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Si un code est fourni, vérifier le code de connexion
    if (code) {
      const loginToken = await LoginToken.findOne({
        userId: user._id,
        token: code.toString().trim(),
      });

      if (!loginToken) {
        return NextResponse.json(
          { error: 'Code de connexion incorrect' },
          { status: 401 }
        );
      }

      // Vérifier l'expiration (même si très lointaine)
      if (new Date() > loginToken.expiresAt) {
        await LoginToken.deleteOne({ _id: loginToken._id });
        return NextResponse.json(
          { error: 'Code de connexion expiré' },
          { status: 401 }
        );
      }

      // Le code est valide, on peut supprimer le token (usage unique) ou le laisser pour réutilisation
      // Pour l'instant, on le laisse pour permettre plusieurs connexions avec le même code
    } else {
      // Vérifier le mot de passe si aucun code n'est fourni
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        );
      }
    }

    // Générer le token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: 'Connexion réussie',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          notificationSettings: user.notificationSettings,
        },
      },
      { status: 200 }
    );

    // Définir le cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
