import { NextRequest, NextResponse } from 'next/server';
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

    // Retourner les variables EmailJS nécessaires pour le client
    return NextResponse.json({
      serviceId: process.env.EMAILJS_SERVICE_ID || '',
      templateIdLoginCode: process.env.EMAILJS_TEMPLATE_ID_LOGIN_CODE || process.env.EMAILJS_TEMPLATE_ID_CREATION || '',
      publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la config EmailJS:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
