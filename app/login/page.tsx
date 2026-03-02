'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import emailjs from '@emailjs/browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useCode, setUseCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: any = { email };
      if (useCode) {
        body.code = code;
      } else {
        body.password = password;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }

      // Rediriger selon le rôle
      if (data.user.role === 'parent') {
        router.push('/parent/calendar');
      } else if (data.user.role === 'educator') {
        router.push('/educator/events');
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        setForgotMessage({ type: 'error', text: data.error || "Une erreur s'est produite." });
        return;
      }

      if (data.sendEmail) {
        const configRes = await fetch('/api/emailjs-config-public');
        const config = await configRes.json();

        if (config.serviceId && config.templateIdLoginCode && config.publicKey && data.parentEmail) {
          const htmlMessage = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de connexion</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0;">Code de connexion</h1>
    <p>Bonjour ${data.parentName || 'Parent'},</p>
    <p>Voici votre code de connexion pour accéder au planning de votre enfant :</p>
    <div style="background-color: #ffffff; border: 2px solid #2563eb; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Votre code de connexion :</p>
      <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">${data.code || ''}</p>
    </div>
    <p>Pour vous connecter, rendez-vous sur :</p>
    <p style="margin: 20px 0;">
      <a href="${data.siteUrl || ''}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder au planning</a>
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Ce code est valable sans limitation de temps. Vous pouvez le modifier à tout moment depuis votre espace parent.
    </p>
    <p style="font-size: 14px; color: #666;">
      Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
      Cette adresse n'est utilisée que pour envoyer des emails dans le cadre de ce site, la boite mail n'est pas consultée, si vous souhaitez écrire au club merci d'utiliser l'adresse habituelle.
    </p>
  </div>
</body>
</html>
          `.trim();

          const templateParams = {
            html_message: htmlMessage,
            to_email: data.parentEmail.trim(),
            user_email: data.parentEmail.trim(),
            to_name: data.parentName || '',
            reply_to: data.parentEmail.trim(),
            subject: 'Code de connexion - Stade Béthunois',
            parent_name: data.parentName || '',
            site_url: data.siteUrl || '',
            login_code: data.code || '',
          };

          await emailjs.send(
            config.serviceId,
            config.templateIdLoginCode,
            templateParams,
            config.publicKey
          );

          setForgotMessage({ type: 'success', text: data.message || 'Email envoyé.' });
          setForgotEmail('');
        } else {
          setForgotMessage({
            type: 'error',
            text: "Configuration email manquante. Veuillez contacter l'administrateur du club.",
          });
        }
      } else {
        setForgotMessage({ type: 'success', text: data.message || 'Email envoyé.' });
        setForgotEmail('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion. Veuillez réessayer.";
      setForgotMessage({ type: 'error', text: msg });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 md:p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Stade Béthunois
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useCode}
                onChange={(e) => {
                  setUseCode(e.target.checked);
                  setPassword('');
                  setCode('');
                  setError('');
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Utiliser un code de connexion</span>
            </label>
          </div>

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              {useCode ? (
                <>
                  <label htmlFor="code" className="sr-only">
                    Code de connexion
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Code de connexion (6 chiffres)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </>
              ) : (
                <>
                  <label htmlFor="password" className="sr-only">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-800 touch-manipulation min-h-[44px]"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Pour obtenir un compte, contactez l&apos;administrateur du club.
          </p>
          <p className="text-center text-sm">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-500 hover:underline"
            >
              Mot de passe oublié
            </button>
          </p>
        </form>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Mot de passe oublié</h2>
            <p className="text-sm text-gray-600 mb-4">
              Entrez l&apos;adresse email utilisée pour votre inscription. Si elle est reconnue, vous recevrez un code de connexion par email.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="votre@email.com"
                />
              </div>
              {forgotMessage && (
                <div
                  className={`p-3 rounded text-sm ${
                    forgotMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {forgotMessage.text}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotMessage(null);
                    setForgotEmail('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {forgotLoading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
