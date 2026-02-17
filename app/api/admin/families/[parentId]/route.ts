import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Child from '@/models/Child';
import '@/models/Team';
import { getAuthUser } from '@/lib/auth';

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

    // Mettre à jour le parent 1
    parent1.name = parentName;
    parent1.email = parentEmail.toLowerCase();
    await parent1.save();

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
          parent2.name = parent2Name;
          parent2.email = parent2Email.toLowerCase();
          await parent2.save();
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

        parent2 = await User.create({
          email: parent2Email.toLowerCase(),
          password: require('crypto').randomBytes(32).toString('hex'), // Mot de passe non utilisé
          name: parent2Name,
          role: 'parent',
          notificationSettings: {
            enabled: true,
            reminderEnabled: true,
          },
        });
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
