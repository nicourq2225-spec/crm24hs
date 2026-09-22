import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AlarmsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) redirect('/login');

  const alarmOpportunities = await prisma.alarmOpportunity.findMany({
    where: {
      status: { not: 'PERDIDO' },
      ...(currentUser.role !== 'ADMIN' && currentUser.name !== 'Administrador' ? { userId: currentUser.id } : {})
    },
    include: {
      customer: true,
      user: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20 md:pb-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-3xl">🛡️</span> Embudo de Alarmas
          </h1>
          <p className="text-slate-500 mt-1">Gestión de potenciales clientes y ventas de monitoreo.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {alarmOpportunities.length === 0 ? (
          <p className="text-slate-500 col-span-full bg-white p-6 text-center rounded-xl border border-slate-200">No hay clientes de alarma activos en este momento.</p>
        ) : (
          alarmOpportunities.map(opp => (
            <div key={opp.id} className="block bg-white p-4 rounded-xl shadow-sm border border-purple-200 border-l-4 border-l-purple-500">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800">{opp.customer.name}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${opp.priority === 'ALTA' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{opp.priority}</span>
              </div>
              <div className="text-sm font-medium text-slate-600 mb-2">
                Interés: {opp.interestLevel || 'Sin definir'} <br/>
                Monitoreo: {opp.monitoringInterest || 'Sin definir'}
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{opp.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
