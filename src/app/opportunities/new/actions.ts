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
  const type = formData.get('type') as string;
  const needDescription = formData.get('needDescription') as string;
  const productInterest = formData.get('productInterest') as string;
  const urgency = formData.get('urgency') as string;

  if (!name || !phone) {
    throw new Error('Nombre y teléfono son obligatorios');
  }

  // CALCULAR PRIORIDAD
  let priority = 'MEDIA';
  if (urgency === 'HOY') priority = 'ALTA';
  if (type === 'NEGOCIO' && ['HOY', 'ESTA_SEMANA'].includes(urgency)) priority = 'ALTA';
  if (urgency === 'MAS_ADELANTE') priority = 'BAJA';

  const nextFollowUp = new Date(); // El seguimiento empieza hoy!

  // Create customer, opportunity, and empty alarm opportunity in a transaction
  const opportunity = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        name,
        phone,
        type,
        origin: origin || 'Stand'
      }
    });

    await tx.alarmOpportunity.create({
      data: {
        customerId: customer.id,
        userId: userId,
        status: 'SIN_CALIFICAR',
        priority: 'BAJA'
      }
    });

    return await tx.opportunity.create({
      data: {
        customerId: customer.id,
        userId: userId,
        status: 'NUEVO',
        priority,
        urgency,
        needDescription,
        productInterest,
        nextFollowUp,
        nextAction: 'Calificar oportunidad y enviar propuesta',
        lastContactDate: new Date(), // El contacto 0
      }
    });
  });

  redirect(`/opportunities/${opportunity.id}`);
}
