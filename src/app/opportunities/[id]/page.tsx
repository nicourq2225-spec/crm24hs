import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddFollowUpForm, QualificationForm, AlarmInfoForm, ProposalDetailsForm } from '@/components/Forms';
import { CommercialAssistant } from '@/components/CommercialAssistant';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/login');

  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          alarmOpportunities: true
        }
      },
      user: true,
      activityLogs: {
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!opportunity) {
    return <div className="p-8 text-center">Oportunidad no encontrada</div>;
  }

  const alarmOpp = opportunity.customer.alarmOpportunities[0] || null;

  const isAlarmOpp = alarmOpp && alarmOpp.interestLevel && ['Alto', 'Medio'].includes(alarmOpp.interestLevel);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-4 space-y-6">
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <a href="/opportunities" className="text-blue-600 font-medium hover:underline text-sm flex items-center">
          ← Volver al listado
        </a>
        <form action={async () => {
          'use server';
          const { moveToTrashAction } = await import('./actions');
          await moveToTrashAction(opportunity.id);
          const { redirect } = await import('next/navigation');
          redirect('/opportunities');
        }}>
          <button type="submit" className="text-slate-400 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs flex items-center transition-colors">
            🗑️ Enviar a papelera
          </button>
        </form>
      </div>

      {/* Header Asistente */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        {opportunity.priority === 'ALTA' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
        {opportunity.priority === 'MEDIA' && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">{opportunity.customer.name}</h1>
              <span className={`px-2 py-1 rounded text-xs font-bold ${opportunity.customer.type === 'NEGOCIO' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                {opportunity.customer.type === 'NEGOCIO' ? '🏪 NEGOCIO' : '🏠 PARTICULAR'}
              </span>
              <a href={`/opportunities/${opportunity.id}/edit`} className="text-slate-400 hover:text-blue-600 transition-colors" title="Editar datos">✏️</a>
            </div>
            <p className="text-slate-600 text-lg flex items-center gap-2 mt-1 font-medium">
              📱 {opportunity.customer.phone}
            </p>
          </div>
          <div className="flex flex-col md:items-end">
            <span className={`font-black px-4 py-2 rounded-xl text-lg ${opportunity.priority === 'ALTA' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
              PRIORIDAD {opportunity.priority}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Producto Consultado</span>
              <span className="font-bold text-slate-800 text-xl">{opportunity.productInterest}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Necesidad Detectada</span>
              <span className="text-slate-700 font-medium">{opportunity.needDescription || 'No especificada'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Etapa Actual</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-block">{opportunity.status}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Próxima Acción</span>
              {opportunity.nextAction ? (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-yellow-800 font-bold">
                  {opportunity.nextAction} 
                  <span className="block text-sm font-medium mt-1 opacity-70">
                    Fecha: {opportunity.nextFollowUp ? format(new Date(opportunity.nextFollowUp), 'dd/MM/yyyy') : 'Sin fecha'}
                  </span>
                </div>
              ) : (
                <div className="bg-red-50 text-red-600 p-2 rounded font-bold text-sm border border-red-200">
                  ⚠️ Esta oportunidad no tiene próxima acción definida.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOTOR DE INTERPRETACIÓN DE NECESIDAD */}
      <CommercialAssistant opportunity={opportunity} alarmOpp={alarmOpp} />

      <div className="grid md:grid-cols-2 gap-6 items-start">
        
        {/* Columna Izquierda: Formularios de Calificación y Acciones */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <span>🎯 Calificación</span>
            </h3>
            <QualificationForm opportunity={opportunity} />
          </div>

          <div className={`bg-white p-6 rounded-2xl shadow-sm border ${isAlarmOpp ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'} space-y-4`}>
            <h3 className="font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
              <span>🔐 Oportunidad de Alarma</span>
              {isAlarmOpp && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold uppercase">Hot Lead</span>}
            </h3>
            <AlarmInfoForm alarmOpportunity={alarmOpp} customerId={opportunity.customerId} opportunityId={opportunity.id} />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <span>📝 Detalles para Presupuesto</span>
            </h3>
            <ProposalDetailsForm opportunity={opportunity} />
          </div>

          <AddFollowUpForm opportunityId={opportunity.id} currentStatus={opportunity.status} />

        </div>

        {/* Columna Derecha: Historial */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
          <h3 className="font-bold text-xl mb-6 text-slate-800">📝 Historial del Cliente</h3>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            
            {opportunity.activityLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-4 relative z-10 bg-white">No hay seguimientos registrados.</div>
            ) : (
              opportunity.activityLogs.map((log) => (
                <div key={log.id} className="relative flex items-start gap-4 z-10">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full border-4 border-white bg-slate-900 text-white font-bold text-xs shadow-sm shrink-0">
                    {log.user.initials}
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-700 text-sm">{log.user.name}</span>
                      <time className="text-xs font-medium text-slate-400">{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}</time>
                    </div>
                    <p className="text-slate-700 text-sm mb-3">{log.comment}</p>
                    {log.previousStatus !== log.newStatus && (
                      <div className="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg inline-block text-slate-500 font-medium shadow-sm">
                        Cambió de <span className="font-bold text-slate-600">{log.previousStatus}</span> a <span className="font-bold text-blue-700">{log.newStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
