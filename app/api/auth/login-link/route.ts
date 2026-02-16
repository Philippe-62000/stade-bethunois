import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LoginToken from '@/models/LoginToken';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

const TOKEN_VALIDITY_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { parentId, sendEmail: shouldSendEmail } = await request.json();
    if (!parentId) {
      return NextResponse.json(
        { error: 'parentId requis' },
        { status: 400 }
      );
    }

    await connectDB();

    const parent = await User.findById(parentId);
    if (!parent) {
      return NextResponse.json(
        { error: 'Parent introuvable' },
        { status: 404 }
      );
    }

    if (parent.role !== 'parent') {
      return NextResponse.json(
        { error: 'L\'utilisateur n\'est pas un parent' },
        { status: 400 }
      );
    }

    // Générer un code provisoire (6 chiffres) sans expiration
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Créer un token avec expiration très lointaine (100 ans) pour le code provisoire
    const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

    await LoginToken.create({
      userId: parentId,
      token: loginCode,
      expiresAt,
    });

    const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const url = `${baseUrl}/login-by-token?token=${loginCode}`;

    // Retourner les données pour l'envoi d'email côté client
    return NextResponse.json({ 
      url, 
      code: loginCode,
      expiresAt,
      parentName: parent.name,
      parentEmail: parent.email,
      siteUrl: baseUrl,
      sendEmail: shouldSendEmail || false
    });
  } catch (error: any) {
    console.error('Erreur lors de la création du lien:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
