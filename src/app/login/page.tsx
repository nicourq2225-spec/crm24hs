'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from './actions';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSelectUser = (userId: string) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
    } else {
      setSelectedUser(userId);
      setPassword('');
      setError('');
    }
  };

  const handleLogin = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await loginAction(userId, password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  // Estos usuarios los sembremos en la DB, pero podemos usar hardcoded para el login.
  const users = [
    { id: '1', initials: 'NU', name: 'NU (Nicolas Urquiza)', role: 'SELLER' },
    { id: '2', initials: 'KC', name: 'KC (Kevin Cassar)', role: 'SELLER' },
    { id: '3', initials: 'NC', name: 'NC (Naara Caselli)', role: 'SELLER' },
    { id: 'admin', initials: 'AD', name: 'Administrador', role: 'ADMIN' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">CRM 24hs</h1>
          <p className="text-slate-500 mt-2">Selecciona tu usuario e ingresa tu contraseña</p>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all">
              <button
                disabled={loading}
                onClick={() => handleSelectUser(user.id)}
                className={`w-full flex items-center justify-between p-4 transition-colors disabled:opacity-50 ${selectedUser === user.id ? 'bg-blue-50 border-b border-blue-100' : 'hover:bg-slate-50'}`}
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
              
              {selectedUser === user.id && (
                <form onSubmit={(e) => handleLogin(e, user.id)} className="p-4 bg-slate-50/50">
                  <div className="flex flex-col gap-3">
                    <input 
                      type="password" 
                      placeholder="Contraseña" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      autoFocus
                    />
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
