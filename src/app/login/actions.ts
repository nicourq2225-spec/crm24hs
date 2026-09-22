'use server';

import { cookies } from 'next/headers';

const PASSWORDS: Record<string, string[]> = {
  '1': ['NicolasUrquiza'],
  '2': ['Kevin Cassar', 'KevinCassar'],
  '3': ['NaaraCaselli'],
  'admin': ['NahuelLaslo']
};

export async function loginAction(userId: string, password?: string) {
  const allowedPasswords = PASSWORDS[userId];
  if (!allowedPasswords) {
    return { error: 'Usuario no válido' };
  }
  
  if (!password || !allowedPasswords.includes(password)) {
    return { error: 'Contraseña incorrecta' };
  }

  const cookieStore = await cookies();
  cookieStore.set('userId', userId, { 
    secure: process.env.NODE_ENV === 'production', 
    path: '/', 
    maxAge: 60 * 30 // 30 minutos
  });
  
  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value;
}
