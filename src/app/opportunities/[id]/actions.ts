'use server';

import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function addFollowUpAction(opportunityId: string, formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('No autorizado');

  const comment = formData.get('comment') as string;
  const status = formData.get('status') as string;
  const nextFollowUp = formData.get('nextFollowUp') as string;
  
  if (!comment || !status) {
    throw new Error('Faltan datos requeridos');
  }

  if (!nextFollowUp && !['Venta concretada', 'Venta perdida'].includes(status)) {
    throw new Error('El próximo seguimiento es obligatorio.');
  }

  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error('Oportunidad no encontrada');

  await prisma.$transaction(async (tx) => {
    await tx.activityLog.create({
      data: {
        opportunityId,
        userId,
        comment,
        previousStatus: opp.status,
        newStatus: status,
      }
    });

    await tx.opportunity.update({
      where: { id: opportunityId },
      data: {
        status,
        nextFollowUp: nextFollowUp ? new Date(`${nextFollowUp}T12:00:00`) : null,
      }
    });
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateEconomicInfoAction(opportunityId: string, formData: FormData) {
  const productModel = formData.get('productModel') as string;
  const budgetValueStr = formData.get('budgetValue') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  const installmentsStr = formData.get('installments') as string;
  
  const budgetValue = budgetValueStr ? parseFloat(budgetValueStr) : null;
  const installments = installmentsStr ? parseInt(installmentsStr) : null;

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      productModel,
      budgetValue,
      paymentMethod,
      installments,
    }
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateAlarmInfoAction(opportunityId: string, formData: FormData) {
  const hasAlarm = formData.get('hasAlarm') as string;
  const alarmOpportunity = formData.get('alarmOpportunity') as string;

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      hasAlarm,
      alarmOpportunity,
    }
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function moveToTrashAction(opportunityId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('No autorizado');

  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error('Oportunidad no encontrada');

  await prisma.$transaction(async (tx) => {
    await tx.activityLog.create({
      data: {
        opportunityId,
        userId,
        comment: 'Oportunidad eliminada (Enviada a papelera)',
        previousStatus: opp.status,
        newStatus: 'Papelera',
      }
    });

    await tx.opportunity.update({
      where: { id: opportunityId },
      data: { status: 'Papelera' }
    });
  });
}

