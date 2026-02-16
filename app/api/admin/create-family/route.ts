import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Child from '@/models/Child';
import '@/models/Team';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

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

    const body = await request.json();
    const {
      parentName,
      parentEmail,
      parent2Name,
      parent2Email,
      children,
      role,
    } = body;

    // Validation
    if (!parentName || !parentEmail) {
      return NextResponse.json(
        { error: 'Nom et email du parent 1 requis' },
        { status: 400 }
      );
    }

    if (!role || !['parent', 'educator', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle requis et valide' },
        { status: 400 }
      );
    }

    if (!children || !Array.isArray(children) || children.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un enfant requis' },
        { status: 400 }
      );
    }

    // Vérifier si les emails existent déjà
    const existingUser1 = await User.findOne({ email: parentEmail.toLowerCase() });
    if (existingUser1) {
      return NextResponse.json(
        { error: `L'email ${parentEmail} est déjà utilisé` },
        { status: 400 }
      );
    }

    if (parent2Email) {
      const existingUser2 = await User.findOne({ email: parent2Email.toLowerCase() });
      if (existingUser2) {
        return NextResponse.json(
          { error: `L'email ${parent2Email} est déjà utilisé` },
          { status: 400 }
        );
      }
    }

    // Générer un mot de passe aléatoire (non utilisé car connexion par token)
    const randomPassword = crypto.randomBytes(32).toString('hex');

    // Créer le parent 1
    const parent1 = await User.create({
      email: parentEmail.toLowerCase(),
      password: randomPassword, // Mot de passe non utilisé
      name: parentName,
      role,
      notificationSettings: {
        enabled: true,
        reminderEnabled: true,
      },
    });

    let parent2 = null;
    if (parent2Name && parent2Email) {
      parent2 = await User.create({
        email: parent2Email.toLowerCase(),
        password: crypto.randomBytes(32).toString('hex'),
        name: parent2Name,
        role,
        notificationSettings: {
          enabled: true,
          reminderEnabled: true,
        },
      });
    }

    // Créer les enfants
    const createdChildren = [];
    for (const childData of children) {
      if (!childData.name || !childData.teamId || !childData.birthDate) {
        continue; // Ignorer les enfants invalides
      }

      const childObj: any = {
        name: childData.name,
        teamId: childData.teamId,
        parentId: parent1._id,
        birthDate: new Date(childData.birthDate),
      };

      if (parent2) {
        childObj.parentId2 = parent2._id;
      }

      const child = await Child.create(childObj);
      createdChildren.push(child);
    }

    return NextResponse.json(
      {
        message: 'Famille créée avec succès',
        parent1: {
          id: parent1._id.toString(),
          name: parent1.name,
          email: parent1.email,
        },
        parent2: parent2 ? {
          id: parent2._id.toString(),
          name: parent2.name,
          email: parent2.email,
        } : null,
        children: createdChildren.map(c => ({
          id: c._id.toString(),
          name: c.name,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création de la famille:', error);
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}
