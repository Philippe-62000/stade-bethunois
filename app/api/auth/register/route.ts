import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, generateToken, getAuthUser } from '@/lib/auth';
import { normalizeRolesInput, getRolesFromUserDoc, type AppRole } from '@/lib/userRoles';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    const authUser = getAuthUser(request);

    if (userCount > 0 && (!authUser || authUser.role !== 'admin')) {
      return NextResponse.json(
        { error: "Seul l'administrateur peut créer des comptes. Contactez-le pour obtenir un accès." },
        { status: 403 }
      );
    }

    const { email, password, name, role } = await request.json();

    let roles: AppRole[] | null = null;
    if (userCount === 0) {
      roles = ['admin'];
    } else {
      roles =
        normalizeRolesInput([role]) ??
        (['parent', 'educator', 'admin'].includes(role) ? [role as AppRole] : null);
    }

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      roles,
      notificationSettings: {
        enabled: true,
        reminderEnabled: true,
      },
    });

    const sessionRole = roles[0];

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: sessionRole,
    });

    const allRoles = getRolesFromUserDoc(user.toObject());

    return NextResponse.json(
      {
        message: 'Utilisateur créé avec succès',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: sessionRole,
          roles: allRoles,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
