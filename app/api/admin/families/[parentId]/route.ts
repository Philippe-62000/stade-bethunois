import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Child from '@/models/Child';
import '@/models/Team';
import { getAuthUser } from '@/lib/auth';
import { getRolesFromUserDoc, normalizeRolesInput, type AppRole } from '@/lib/userRoles';
import { syncEducatorTeams, clearEducatorFromAllTeams } from '@/lib/educatorTeams';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    const { parentId } = await params;
    const body = await request.json();
    const {
      parentName,
      parentEmail,
      parent2Name,
      parent2Email,
      children,
      parent1Roles,
      parent2Roles,
      parent1EducatorTeamIds,
      parent2EducatorTeamIds,
    } = body;

    // Validation
    if (!parentName || !parentEmail) {
      return NextResponse.json(
        { error: 'Nom et email du parent 1 requis' },
        { status: 400 }
      );
    }

    // Vérifier que le parent existe
    const parent1 = await User.findById(parentId);
    if (!parent1) {
      return NextResponse.json(
        { error: 'Parent introuvable' },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (parentEmail.toLowerCase() !== parent1.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: parentEmail.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== parentId) {
        return NextResponse.json(
          { error: `L'email ${parentEmail} est déjà utilisé` },
          { status: 400 }
        );
      }
    }

    const prevRoles1 = getRolesFromUserDoc(parent1.toObject());
    let nextRoles1: AppRole[] | null = normalizeRolesInput(parent1Roles);
    if (!nextRoles1) nextRoles1 = prevRoles1;
    const childCountP1 = await Child.countDocuments({
      $or: [{ parentId }, { parentId2: parentId }],
    });
    if (childCountP1 > 0 && !nextRoles1.includes('parent')) {
      return NextResponse.json(
        { error: 'Le parent 1 doit conserver le rôle « parent » tant qu’il a des enfants liés à ce compte.' },
        { status: 400 }
      );
    }

    // Mettre à jour le parent 1
    parent1.name = parentName;
    parent1.email = parentEmail.toLowerCase();
    parent1.roles = nextRoles1;
    await parent1.save();

    if (prevRoles1.includes('educator') && !nextRoles1.includes('educator')) {
      await clearEducatorFromAllTeams(parentId);
    } else if (nextRoles1.includes('educator') && Array.isArray(parent1EducatorTeamIds)) {
      await syncEducatorTeams(parentId, parent1EducatorTeamIds);
    }

    // Gérer le parent 2
    let parent2 = null;
    if (parent2Name && parent2Email) {
      // Chercher si un parent2 existe déjà pour cette famille
      const existingChildren = await Child.find({ parentId });
      const existingParent2Id = existingChildren.find(c => c.parentId2)?.parentId2;
      
      if (existingParent2Id) {
        const parent2Id = typeof existingParent2Id === 'object' 
          ? existingParent2Id._id.toString() 
          : existingParent2Id.toString();
        parent2 = await User.findById(parent2Id);
        
        if (parent2) {
          // Vérifier si l'email est déjà utilisé
          if (parent2Email.toLowerCase() !== parent2.email.toLowerCase()) {
            const existingUser = await User.findOne({ email: parent2Email.toLowerCase() });
            if (existingUser && existingUser._id.toString() !== parent2Id) {
              return NextResponse.json(
                { error: `L'email ${parent2Email} est déjà utilisé` },
                { status: 400 }
              );
            }
          }
          const prevRoles2 = getRolesFromUserDoc(parent2.toObject());
          let nextRoles2: AppRole[] | null = normalizeRolesInput(parent2Roles);
          if (!nextRoles2) nextRoles2 = prevRoles2;
          const childCountP2 = await Child.countDocuments({
            $or: [{ parentId: parent2Id }, { parentId2: parent2Id }],
          });
          if (childCountP2 > 0 && !nextRoles2.includes('parent')) {
            return NextResponse.json(
              {
                error:
                  'Le parent 2 doit conserver le rôle « parent » tant qu’il a des enfants liés à ce compte.',
              },
              { status: 400 }
            );
          }
          parent2.name = parent2Name;
          parent2.email = parent2Email.toLowerCase();
          parent2.roles = nextRoles2;
          await parent2.save();

          if (prevRoles2.includes('educator') && !nextRoles2.includes('educator')) {
            await clearEducatorFromAllTeams(parent2Id);
          } else if (nextRoles2.includes('educator') && Array.isArray(parent2EducatorTeamIds)) {
            await syncEducatorTeams(parent2Id, parent2EducatorTeamIds);
          }
        }
      } else {
        // Créer un nouveau parent2
        const existingUser = await User.findOne({ email: parent2Email.toLowerCase() });
        if (existingUser) {
          return NextResponse.json(
            { error: `L'email ${parent2Email} est déjà utilisé` },
            { status: 400 }
          );
        }

        const pr2 = normalizeRolesInput(parent2Roles);
        const rolesNew: AppRole[] = pr2 && pr2.length > 0 ? pr2 : ['parent'];

        parent2 = await User.create({
          email: parent2Email.toLowerCase(),
          password: require('crypto').randomBytes(32).toString('hex'), // Mot de passe non utilisé
          name: parent2Name,
          roles: rolesNew,
          notificationSettings: {
            enabled: true,
            reminderEnabled: true,
          },
        });
        if (rolesNew.includes('educator') && Array.isArray(parent2EducatorTeamIds)) {
          await syncEducatorTeams(parent2._id.toString(), parent2EducatorTeamIds);
        }
      }
    } else {
      // Supprimer le parent2 si on le retire
      const existingChildren = await Child.find({ parentId });
      const existingParent2Id = existingChildren.find(c => c.parentId2)?.parentId2;
      if (existingParent2Id) {
        const parent2Id = typeof existingParent2Id === 'object' 
          ? existingParent2Id._id.toString() 
          : existingParent2Id.toString();
        
        // Vérifier si le parent2 a d'autres enfants
        const otherChildren = await Child.countDocuments({
          $or: [
            { parentId: parent2Id },
            { parentId2: parent2Id }
          ],
          parentId: { $ne: parentId }
        });
        
        if (otherChildren === 0) {
          await User.findByIdAndDelete(parent2Id);
        }
        
        // Retirer parentId2 de tous les enfants de cette famille
        await Child.updateMany(
          { parentId },
          { $unset: { parentId2: 1 } }
        );
      }
    }

    // Mettre à jour les enfants
    if (children && Array.isArray(children)) {
      const existingChildren = await Child.find({ parentId });
      const existingChildIds = existingChildren.map(c => c._id.toString());
      const newChildIds = children.filter((c: any) => c.id).map((c: any) => c.id);
      
      // Supprimer les enfants qui ne sont plus dans la liste
      const toDelete = existingChildIds.filter(id => !newChildIds.includes(id));
      if (toDelete.length > 0) {
        await Child.deleteMany({ _id: { $in: toDelete } });
      }

      // Mettre à jour ou créer les enfants
      for (const childData of children) {
        if (!childData.name || !childData.teamId) {
          continue;
        }

        const birthDate = childData.birthDate ? new Date(childData.birthDate) : new Date('2000-01-01');

        if (childData.id) {
          // Mettre à jour l'enfant existant (conserver birthDate existant si non fourni)
          await Child.findByIdAndUpdate(childData.id, {
            name: childData.name,
            teamId: childData.teamId,
            ...(childData.birthDate && { birthDate: new Date(childData.birthDate) }),
            ...(parent2 && { parentId2: parent2._id }),
          });
        } else {
          // Créer un nouvel enfant
          await Child.create({
            name: childData.name,
            teamId: childData.teamId,
            parentId,
            ...(parent2 && { parentId2: parent2._id }),
            birthDate,
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Famille mise à jour avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la famille:', error);
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}
