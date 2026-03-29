'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROLE_LABELS, type AppRole } from '@/lib/userRoles';

function redirectForActiveRole(router: ReturnType<typeof useRouter>, role: string) {
  const d = new Date();
  const todayLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (role === 'parent') router.replace('/parent/calendar');
  else if (role === 'educator') router.replace(`/educator/availabilities?date=${todayLocal}`);
  else if (role === 'admin') router.replace('/admin');
  else router.replace('/');
}

function LoginByTokenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'pickRole' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const completeWithRole = useCallback(
    async (selectedRole: AppRole) => {
      if (!linkToken) return;
      setCompleting(true);
      setMessage('');
      try {
        const res = await fetch('/api/auth/complete-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: linkToken, role: selectedRole }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error || 'Erreur de connexion');
          setStatus('error');
          return;
        }
        setStatus('ok');
        redirectForActiveRole(router, data.user.role);
      } catch {
        setMessage('Erreur de connexion.');
        setStatus('error');
      } finally {
        setCompleting(false);
      }
    },
    [linkToken, router]
  );

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide.');
      return;
    }

    fetch(`/api/auth/login-by-token?token=${encodeURIComponent(token)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Lien expiré ou invalide.');
          return;
        }
        if (data.requiresRoleSelection && data.roles?.length && data.loginToken) {
          setRoles(data.roles);
          setLinkToken(data.loginToken);
          setStatus('pickRole');
          return;
        }
        setStatus('ok');
        const role = data.user?.role;
        if (role) redirectForActiveRole(router, role);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erreur de connexion.');
      });
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    );
  }

  if (status === 'pickRole') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Choisir un profil</h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Plusieurs profils sont associés à ce lien. Sélectionnez celui à utiliser :
          </p>
          <div className="flex flex-col gap-2">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                disabled={completing}
                onClick={() => completeWithRole(r)}
                className="w-full py-3 px-4 border border-gray-300 rounded-md hover:bg-blue-50 font-medium text-left disabled:opacity-50"
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">{message}</p>
          <a href="/login" className="text-blue-600 hover:underline">
            Aller à la page de connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Redirection...</p>
    </div>
  );
}

export default function LoginByTokenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Chargement...</p>
        </div>
      }
    >
      <LoginByTokenContent />
    </Suspense>
  );
}
