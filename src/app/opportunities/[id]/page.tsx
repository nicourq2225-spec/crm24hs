import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddFollowUpForm, EconomicInfoForm, AlarmInfoForm } from '@/components/Forms';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/login');

  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: true,
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

  const formatCurrency = (val: number | null) => {
    if (val === null) return '-';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-4 space-y-6">
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <a href="/opportunities" className="text-blue-600 font-medium hover:underline text-sm flex items-center">
          ← Volver
        </a>
        <form action={async () => {
          'use server';
          const { moveToTrashAction } = await import('./actions');
          await moveToTrashAction(opportunity.id);
          const { redirect } = await import('next/navigation');
          redirect('/opportunities');
        }}>
          <button type="submit" className="text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors">
            🗑️ Eliminar Cliente
          </button>
        </form>
      </div>

      {/* Header Ficha */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{opportunity.customer.name}</h1>
            <p className="text-slate-600 text-lg flex items-center gap-2 mt-1">
              📱 {opportunity.customer.phone}
            </p>
          </div>
          <div className="flex flex-col md:items-end">
            <span className="text-sm text-slate-500 font-medium">Vendedor Asignado</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                {opportunity.user.initials}
              </div>
              <span className="font-bold text-slate-800 text-lg">{opportunity.user.name}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase block mb-1">🛒 Producto</span>
            <span className="font-semibold text-slate-800 block text-lg">{opportunity.productInterest}</span>
            {opportunity.productModel && <span className="text-sm text-slate-500">{opportunity.productModel}</span>}
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase block mb-1">💰 Presupuesto</span>
            <span className="font-semibold text-slate-800 block text-lg">{formatCurrency(opportunity.budgetValue)}</span>
            {opportunity.paymentMethod && <span className="text-sm text-slate-500 block leading-tight mt-1">{opportunity.paymentMethod} {opportunity.installments ? `(${opportunity.installments} cuotas)` : ''}</span>}
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase block mb-1">📌 Estado</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-block text-sm">{opportunity.status}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase block mb-1">📅 Próximo Seguimiento</span>
            <span className="font-bold text-slate-800 block text-lg">
              {opportunity.nextFollowUp ? format(new Date(opportunity.nextFollowUp), 'dd/MM/yyyy') : 'Sin programar'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        
        {/* Columna Izquierda: Formularios */}
        <div className="space-y-6">
          
          <AddFollowUpForm opportunityId={opportunity.id} currentStatus={opportunity.status} />

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Datos Económicos</h3>
            <EconomicInfoForm opportunity={opportunity} />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Información de Alarma</h3>
            <AlarmInfoForm opportunity={opportunity} />
          </div>

        </div>

        {/* Columna Derecha: Historial */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
          <h3 className="font-bold text-xl mb-6 text-slate-800">📝 Historial de Seguimientos</h3>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            
            {opportunity.activityLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-4 relative z-10 bg-white">No hay seguimientos registrados.</div>
            ) : (
              opportunity.activityLogs.map((log) => (
                <div key={log.id} className="relative flex items-start gap-4 z-10">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full border-4 border-white bg-blue-100 text-blue-700 font-bold text-xs shadow-sm shrink-0">
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
