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
  const nextAction = formData.get('nextAction') as string;
  const nextFollowUp = formData.get('nextFollowUp') as string;
  const isEffectiveContact = formData.get('isEffectiveContact') === 'true';
  const lossReason = formData.get('lossReason') as string | undefined;
  const lossObservation = formData.get('lossObservation') as string | undefined;
  
  if (!comment || !status) {
    throw new Error('Faltan datos requeridos');
  }

  if (!nextFollowUp && !['GANADO', 'PERDIDO'].includes(status)) {
    throw new Error('El próximo seguimiento es obligatorio para oportunidades abiertas.');
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

    const updateData: any = {
      status,
      nextAction: nextAction || null,
      nextFollowUp: nextFollowUp ? new Date(`${nextFollowUp}T12:00:00`) : null,
    };

    if (isEffectiveContact) {
      updateData.lastContactDate = new Date();
    }

    if (status === 'PERDIDO') {
      updateData.lossReason = lossReason;
      updateData.lossObservation = lossObservation;
    }

    await tx.opportunity.update({
      where: { id: opportunityId },
      data: updateData
    });
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateQualificationAction(opportunityId: string, formData: FormData) {
  const qLocation = formData.get('qLocation') as string;
  const qTargets = formData.getAll('qTargets') as string[];
  const qHasCameras = formData.get('qHasCameras') as string;
  const qZones = formData.get('qZones') as string;
  const qMobileAccess = formData.get('qMobileAccess') as string;
  const qInstallRequired = formData.get('qInstallRequired') as string;
  let recommendedSolution = formData.get('recommendedSolution') as string;
  const manualPriority = formData.get('priority') as string;

  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId }, include: { customer: { include: { alarmOpportunities: true } } } });
  if (!opp) return;

  const isBusiness = opp.customer.type === 'NEGOCIO';
  const alarmOpp = opp.customer.alarmOpportunities[0];
  const isAlarmHot = alarmOpp && (alarmOpp.monitoringInterest === 'Interesado' || alarmOpp.interestLevel === 'Alto');

  // Calcular Auto Prioridad
  let calculatedPriority = 'BAJA';
  if (opp.urgency === 'HOY' || opp.urgency === 'ESTA_SEMANA' || (isBusiness && qZones >= '2') || qZones >= '3' || qInstallRequired === 'Equipo + instalación' || isAlarmHot) {
    calculatedPriority = 'ALTA';
  } else if (opp.urgency === 'ESTE_MES' || qZones === '1' || qZones === '2') {
    calculatedPriority = 'MEDIA';
  }

  // Calculate Solution Suggestion if not manually overridden
  if (!recommendedSolution) {
    if (qLocation === 'Exterior') recommendedSolution = 'Solución Exterior';
    else if (qTargets?.includes('Entrada') && qZones === '1') recommendedSolution = 'Solución Entrada';
    else if (isBusiness) {
      if (qZones === '3' || qZones === '4' || qZones === '5+') recommendedSolution = 'PROYECTO';
      else recommendedSolution = 'Solución Negocio';
    } else {
      if (qZones === '1') recommendedSolution = 'Solución Casa (Cámara individual)';
      else if (qZones && qZones !== 'No definido') recommendedSolution = 'Solución Casa Multizona';
    }
  }

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      qLocation,
      qTargets,
      qHasCameras,
      qZones,
      qMobileAccess,
      qInstallRequired,
      recommendedSolution,
      priority: manualPriority || calculatedPriority,
    }
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateAlarmInfoAction(customerId: string, opportunityId: string, formData: FormData) {
  const hasAlarm = formData.get('hasAlarm') as string;
  const interestLevel = formData.get('interestLevel') as string;
  const propertyType = formData.get('propertyType') as string;
  const monitoringInterest = formData.get('monitoringInterest') as string;
  const nextAction = formData.get('nextAction') as string;
  const status = formData.get('status') as string;

  const alarmOpp = await prisma.alarmOpportunity.findFirst({
    where: { customerId }
  });

  if (alarmOpp) {
    await prisma.alarmOpportunity.update({
      where: { id: alarmOpp.id },
      data: {
        hasAlarm,
        interestLevel,
        propertyType,
        monitoringInterest,
        nextAction,
        status: status || alarmOpp.status,
      }
    });
  } else {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || '1';
    await prisma.alarmOpportunity.create({
      data: {
        customerId,
        userId,
        hasAlarm,
        interestLevel,
        propertyType,
        monitoringInterest,
        nextAction,
        status: status || 'INTERESADO',
      }
    });
  }

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

export async function editCustomerAction(opportunityId: string, formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('No autorizado');

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const type = formData.get('type') as string;

  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error('Oportunidad no encontrada');

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: opp.customerId },
      data: { name, phone, type }
    });
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateProposalDetailsAction(opportunityId: string, formData: FormData) {
  const proposalProducts = formData.get('proposalProducts') as string;
  const proposalBenefits = formData.get('proposalBenefits') as string;
  const budgetValueStr = formData.get('budgetValue') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  
  const budgetValue = budgetValueStr ? parseFloat(budgetValueStr) : null;

  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      proposalProducts,
      proposalBenefits,
      budgetValue,
      paymentMethod,
    }
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}
