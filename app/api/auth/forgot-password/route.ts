import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LoginToken from '@/models/LoginToken';
import { sendLoginCodeEmailToParent } from '@/lib/emailjs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!trimmedEmail) {
      return NextResponse.json(
        { error: 'Adresse email requise' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: trimmedEmail,
      role: 'parent',
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Merci de vérifier votre adresse, nous n'avons pas cette adresse dans la liste. Si vous voulez vous inscrire merci de contacter l'administrateur du groupe.",
        },
        { status: 404 }
      );
    }

    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

    await LoginToken.create({
      userId: user._id,
      token: loginCode,
      expiresAt,
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    await sendLoginCodeEmailToParent({
      parent_name: user.name,
      site_url: baseUrl,
      login_code: loginCode,
      to_email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Un email avec votre code de connexion a été envoyé.',
    });
  } catch (error: any) {
    console.error('Erreur mot de passe oublié:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard." },
      { status: 500 }
    );
  }
}
