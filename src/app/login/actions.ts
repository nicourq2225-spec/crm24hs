'use server';

import { cookies } from 'next/headers';

export async function loginAction(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('userId', userId, { secure: true, path: '/' });
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value;
}
