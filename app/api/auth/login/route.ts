import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import '@/models/User';
import User from '@/models/User';
import '@/models/LoginToken';
import LoginToken from '@/models/LoginToken';
import { comparePassword, generateToken } from '@/lib/auth';
import { getRolesFromUserDoc, type AppRole } from '@/lib/userRoles';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password, code, role: requestedRole } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    if (!password && !code) {
      return NextResponse.json({ error: 'Mot de passe ou code requis' }, { status: 400 });
    }

    const emailNormalized = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    if (code) {
      const loginToken = await LoginToken.findOne({
        userId: user._id,
        token: code.toString().trim(),
      });

      if (!loginToken) {
        return NextResponse.json({ error: 'Code de connexion incorrect' }, { status: 401 });
      }

      if (new Date() > loginToken.expiresAt) {
        await LoginToken.deleteOne({ _id: loginToken._id });
        return NextResponse.json({ error: 'Code de connexion expiré' }, { status: 401 });
      }
    } else {
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
      }
    }

    const roles = getRolesFromUserDoc(user.toObject());

    if (roles.length > 1 && !requestedRole) {
      return NextResponse.json(
        {
          requiresRoleSelection: true,
          roles,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          },
        },
        { status: 200 }
      );
    }

    const activeRole: AppRole =
      roles.length === 1
        ? roles[0]
        : requestedRole && roles.includes(requestedRole as AppRole)
          ? (requestedRole as AppRole)
          : roles[0];

    if (roles.length > 1 && requestedRole && !roles.includes(requestedRole as AppRole)) {
      return NextResponse.json({ error: 'Rôle invalide pour ce compte' }, { status: 400 });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: activeRole,
    });

    const response = NextResponse.json(
      {
        message: 'Connexion réussie',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: activeRole,
          roles,
          notificationSettings: user.notificationSettings,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
  }
}
