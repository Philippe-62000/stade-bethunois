import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Child from '@/models/Child';
import Availability from '@/models/Availability';
import '@/models/Team';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();

    // Récupérer tous les parents
    const parents = await User.find({ role: 'parent' }).sort({ name: 1 });

    // Récupérer tous les enfants avec leurs parents
    const children = await Child.find()
      .populate('parentId', 'name email')
      .populate('parentId2', 'name email')
      .populate('teamId', 'name category')
      .sort({ name: 1 });

    // Grouper les enfants par famille (parentId)
    const familiesMap = new Map<string, {
      parent1: { id: string; name: string; email: string };
      parent2?: { id: string; name: string; email: string };
      children: Array<{
        id: string;
        name: string;
        teamId: { name: string; category: string };
        birthDate: Date;
      }>;
    }>();

    for (const child of children) {
      const parent1Id = typeof child.parentId === 'object' ? child.parentId._id.toString() : child.parentId.toString();
      
      if (!familiesMap.has(parent1Id)) {
        const parent1 = typeof child.parentId === 'object' ? child.parentId : parents.find(p => p._id.toString() === parent1Id);
        if (!parent1) continue;

        familiesMap.set(parent1Id, {
          parent1: {
            id: parent1Id,
            name: typeof parent1 === 'object' ? parent1.name : '',
            email: typeof parent1 === 'object' ? parent1.email : '',
          },
          children: [],
        });
      }

      const family = familiesMap.get(parent1Id)!;
      
      // Ajouter parent2 si présent
      if (child.parentId2) {
        const parent2Id = typeof child.parentId2 === 'object' ? child.parentId2._id.toString() : child.parentId2.toString();
        if (!family.parent2) {
          const parent2 = typeof child.parentId2 === 'object' ? child.parentId2 : parents.find(p => p._id.toString() === parent2Id);
          if (parent2) {
            family.parent2 = {
              id: parent2Id,
              name: typeof parent2 === 'object' ? parent2.name : '',
              email: typeof parent2 === 'object' ? parent2.email : '',
            };
          }
        }
      }

      // Ajouter l'enfant
      family.children.push({
        id: child._id.toString(),
        name: child.name,
        teamId: typeof child.teamId === 'object' ? {
          name: child.teamId.name,
          category: child.teamId.category || '',
        } : { name: '', category: '' },
        birthDate: child.birthDate,
      });
    }

    // Convertir en tableau
    const families = Array.from(familiesMap.values());

    return NextResponse.json({ families });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des familles:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const { parentId } = body;

    if (!parentId) {
      return NextResponse.json(
        { error: 'parentId requis' },
        { status: 400 }
      );
    }

    // Trouver tous les enfants de cette famille
    const children = await Child.find({
      $or: [
        { parentId },
        { parentId2: parentId }
      ]
    });

    // Trouver le parent2 si présent
    const parent2Ids = new Set<string>();
    for (const child of children) {
      if (child.parentId2) {
        const parent2Id = typeof child.parentId2 === 'object' 
          ? child.parentId2._id.toString() 
          : child.parentId2.toString();
        if (parent2Id !== parentId) {
          parent2Ids.add(parent2Id);
        }
      }
    }

    // Supprimer tous les enfants
    const childIds = children.map(c => c._id);
    
    // Supprimer les disponibilités liées aux enfants
    await Availability.deleteMany({ childId: { $in: childIds } });
    
    // Supprimer les enfants
    await Child.deleteMany({ _id: { $in: childIds } });

    // Supprimer le parent1
    await User.findByIdAndDelete(parentId);

    // Supprimer le parent2 seulement s'il n'a plus d'enfants
    for (const parent2Id of parent2Ids) {
      const remainingChildren = await Child.countDocuments({
        $or: [
          { parentId: parent2Id },
          { parentId2: parent2Id }
        ]
      });
      if (remainingChildren === 0) {
        await User.findByIdAndDelete(parent2Id);
      }
    }

    return NextResponse.json({ 
      message: 'Famille supprimée avec succès',
      deletedChildren: childIds.length,
      deletedParents: 1 + (parent2Ids.size > 0 ? 1 : 0)
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la famille:', error);
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    );
  }
}
