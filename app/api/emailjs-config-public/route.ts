import { NextRequest, NextResponse } from 'next/server';

/** Config EmailJS publique (pour mot de passe oublié) - pas d'auth requise */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      serviceId: process.env.EMAILJS_SERVICE_ID || '',
      templateIdLoginCode: process.env.EMAILJS_TEMPLATE_ID_LOGIN_CODE || process.env.EMAILJS_TEMPLATE_ID_CREATION || '',
      publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
    });
  } catch (error: any) {
    console.error('Erreur config EmailJS publique:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
