'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from './actions';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (userId: string) => {
    setLoading(true);
    await loginAction(userId);
    router.push('/');
  };

  // Estos usuarios los sembremos en la DB, pero podemos usar hardcoded para el login.
  const users = [
    { id: '1', initials: 'NU', name: 'NU (Vendedor)', role: 'SELLER' },
    { id: '2', initials: 'KC', name: 'KC (Vendedor)', role: 'SELLER' },
    { id: '3', initials: 'NC', name: 'NC (Vendedor)', role: 'SELLER' },
    { id: 'admin', initials: 'AD', name: 'Administrador', role: 'ADMIN' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">CRM 24hs</h1>
          <p className="text-slate-500 mt-2">Selecciona tu usuario para ingresar</p>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <button
              key={user.id}
              disabled={loading}
              onClick={() => handleLogin(user.id)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {user.initials}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.role === 'ADMIN' ? 'Control Total' : 'Tus oportunidades'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
