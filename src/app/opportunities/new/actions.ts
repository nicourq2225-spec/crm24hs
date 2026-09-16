'use server';

import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createOpportunityAction(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('No autorizado');

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const origin = formData.get('origin') as string;
  const productInterest = formData.get('productInterest') as string;
  const status = formData.get('status') as string;
  const nextFollowUp = formData.get('nextFollowUp') as string;
  
  if (!name || !phone || !productInterest || !status) {
    throw new Error('Faltan datos requeridos');
  }

  // Next follow up is required unless status is won/lost
  if (!nextFollowUp && !['Venta concretada', 'Venta perdida'].includes(status)) {
    throw new Error('El próximo seguimiento es obligatorio para oportunidades abiertas.');
  }

  // Create customer and opportunity in a transaction
  const opportunity = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        name,
        phone,
        origin: origin || 'Otro'
      }
    });

    return await tx.opportunity.create({
      data: {
        customerId: customer.id,
        userId: userId,
        productInterest,
        status,
        nextFollowUp: nextFollowUp ? new Date(`${nextFollowUp}T12:00:00`) : null,
      }
    });
  });

  redirect(`/opportunities/${opportunity.id}`);
}
