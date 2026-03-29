import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Child from '@/models/Child';
import '@/models/Team';
import { getAuthUser } from '@/lib/auth';
import { syncEducatorTeams } from '@/lib/educatorTeams';
import { normalizeRolesInput, type AppRole } from '@/lib/userRoles';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      parentName,
      parentEmail,
      parent2Name,
      parent2Email,
      children,
      role: legacyRole,
      roles: rolesInput,
      educatorTeamIds,
    } = body;

    if (!parentName || !parentEmail) {
      return NextResponse.json({ error: 'Nom et email du parent 1 requis' }, { status: 400 });
    }

    const roles: AppRole[] | null =
      normalizeRolesInput(rolesInput) ??
      (legacyRole && ['parent', 'educator', 'admin'].includes(legacyRole) ? [legacyRole as AppRole] : null);

    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: 'Au moins un rôle requis' }, { status: 400 });
    }

    if (roles.includes('parent')) {
      if (!children || !Array.isArray(children) || children.length === 0) {
        return NextResponse.json(
          { error: 'Au moins un enfant requis lorsque le compte inclut le rôle parent' },
          { status: 400 }
        );
      }
    }

    const childrenArray = Array.isArray(children) ? children : [];

    const existingUser1 = await User.findOne({ email: parentEmail.toLowerCase() });
    if (existingUser1) {
      return NextResponse.json({ error: `L'email ${parentEmail} est déjà utilisé` }, { status: 400 });
    }

    if (parent2Email) {
      const existingUser2 = await User.findOne({ email: parent2Email.toLowerCase() });
      if (existingUser2) {
        return NextResponse.json({ error: `L'email ${parent2Email} est déjà utilisé` }, { status: 400 });
      }
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');

    const parent1 = await User.create({
      email: parentEmail.toLowerCase(),
      password: randomPassword,
      name: parentName,
      roles,
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
        roles,
        notificationSettings: {
          enabled: true,
          reminderEnabled: true,
        },
      });
    }

    const createdChildren = [];
    if (childrenArray.length > 0) {
      for (const childData of childrenArray) {
        if (!childData.name || !childData.teamId) {
          continue;
        }

        const childObj: any = {
          name: childData.name,
          teamId: childData.teamId,
          parentId: parent1._id,
          birthDate: childData.birthDate ? new Date(childData.birthDate) : new Date('2000-01-01'),
        };

        if (parent2) {
          childObj.parentId2 = parent2._id;
        }

        const child = await Child.create(childObj);
        createdChildren.push(child);
      }
    }

    if (roles.includes('educator')) {
      const ids = Array.isArray(educatorTeamIds) ? educatorTeamIds : [];
      await syncEducatorTeams(parent1._id.toString(), ids);
    }

    return NextResponse.json(
      {
        message: 'Famille créée avec succès',
        parent1: {
          id: parent1._id.toString(),
          name: parent1.name,
          email: parent1.email,
        },
        parent2: parent2
          ? {
              id: parent2._id.toString(),
              name: parent2.name,
              email: parent2.email,
            }
          : null,
        children: createdChildren.map((c) => ({
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
