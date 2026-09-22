import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { format, isToday, isPast, isFuture, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) redirect('/login');

  // Fetch opportunities
  const opportunities = await prisma.opportunity.findMany({
    where: {
      status: { not: 'Papelera' },
      ...(currentUser.role === 'ADMIN' ? {} : { userId: currentUser.id }),
    },
    include: {
      customer: {
        include: { alarmOpportunities: true }
      },
    },
    orderBy: { updatedAt: 'desc' }
  });

  const today = startOfDay(new Date());

  // Filters
  const nuevosLeads = opportunities.filter(o => o.status === 'NUEVO');
  const seguimientosHoy = opportunities.filter(o => 
    !['GANADO', 'PERDIDO', 'NUTRICION'].includes(o.status) &&
    o.nextFollowUp &&
    isToday(o.nextFollowUp)
  ).sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());

  const seguimientosAtrasados = opportunities.filter(o => 
    !['GANADO', 'PERDIDO', 'NUTRICION'].includes(o.status) &&
    o.nextFollowUp &&
    isPast(o.nextFollowUp) && !isToday(o.nextFollowUp)
  ).sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());

  const propuestasPendientes = opportunities.filter(o => o.status === 'PROPUESTA_ENVIADA');
  const oportunidadesCalientes = opportunities.filter(o => o.priority === 'ALTA' && !['GANADO', 'PERDIDO'].includes(o.status));

  const alarmOpps = await prisma.alarmOpportunity.findMany({
    where: {
      ...(currentUser.role === 'ADMIN' ? {} : { userId: currentUser.id }),
    },
    include: { customer: true }
  });

  const alarmasInteresados = alarmOpps.filter(a => ['Alto', 'Medio'].includes(a.interestLevel || ''));

  // For Admins, we return a completely different dashboard
  if (currentUser.role === 'ADMIN' || currentUser.name === 'Administrador') {
    const allUsers = await prisma.user.findMany();
    
    // Admin Metrics
    const totalLeads = opportunities.length;
    const oppsGanados = opportunities.filter(o => o.status === 'GANADO');
    const oppsPerdidos = opportunities.filter(o => o.status === 'PERDIDO' || o.status === 'Papelera');
    const oppsAbiertos = opportunities.filter(o => !['GANADO', 'PERDIDO', 'Papelera'].includes(o.status));
    
    const winRate = (oppsGanados.length + oppsPerdidos.length) > 0 
      ? Math.round((oppsGanados.length / (oppsGanados.length + oppsPerdidos.length)) * 100) 
      : 0;

    const totalVendido = oppsGanados.reduce((acc, curr) => acc + (curr.budgetValue || 0), 0);
    const pipelineEsperado = oppsAbiertos.reduce((acc, curr) => acc + (curr.budgetValue || 0), 0);

    // Funnel data
    const funnel = {
      nuevos: opportunities.filter(o => o.status === 'NUEVO').length,
      contactados: opportunities.filter(o => o.status === 'CONTACTADO' || o.status === 'NECESIDAD_IDENTIFICADA').length,
      presupuestos: opportunities.filter(o => o.status === 'PROPUESTA_ENVIADA' || o.status === 'SEGUIMIENTO').length,
      ganados: oppsGanados.length,
    };
    const maxFunnel = Math.max(funnel.nuevos, funnel.contactados, funnel.presupuestos, funnel.ganados) || 1;

    // Seller performance
    const sellersPerformance = allUsers.map(user => {
      const userOpps = opportunities.filter(o => o.userId === user.id);
      const won = userOpps.filter(o => o.status === 'GANADO');
      const lost = userOpps.filter(o => o.status === 'PERDIDO' || o.status === 'Papelera');
      const open = userOpps.filter(o => !['GANADO', 'PERDIDO', 'Papelera'].includes(o.status));
      const revenue = won.reduce((acc, curr) => acc + (curr.budgetValue || 0), 0);
      const wr = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
      
      return { id: user.id, name: user.name, total: userOpps.length, open: open.length, won: won.length, revenue, winRate: wr };
    }).sort((a, b) => b.revenue - a.revenue);

    return (
      <div className="max-w-6xl mx-auto p-4 pb-24 space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control (Jefe de Ventas)</h1>
          <p className="text-slate-500 font-medium mt-1">Métricas clave, rendimiento del equipo y proyecciones.</p>
        </header>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 font-bold text-xs tracking-wider mb-1">TOTAL VENDIDO</div>
            <div className="text-3xl font-black text-green-600">${totalVendido.toLocaleString('es-AR')}</div>
            <div className="text-xs text-slate-400 mt-2 font-medium">{oppsGanados.length} negocios cerrados</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 font-bold text-xs tracking-wider mb-1">PIPELINE ESPERADO</div>
            <div className="text-3xl font-black text-blue-600">${pipelineEsperado.toLocaleString('es-AR')}</div>
            <div className="text-xs text-slate-400 mt-2 font-medium">{oppsAbiertos.length} negocios abiertos</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 font-bold text-xs tracking-wider mb-1">TASA DE CONVERSIÓN</div>
            <div className="text-3xl font-black text-purple-600">{winRate}%</div>
            <div className="text-xs text-slate-400 mt-2 font-medium">De las oportunidades gestionadas</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 font-bold text-xs tracking-wider mb-1">TOTAL LEADS</div>
            <div className="text-3xl font-black text-slate-800">{totalLeads}</div>
            <div className="text-xs text-slate-400 mt-2 font-medium">Leads ingresados en total</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* SALES FUNNEL CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              📊 Embudo de Ventas Global
            </h2>
            <div className="space-y-5">
              {[
                { label: '1. Nuevos / Sin Tocar', value: funnel.nuevos, color: 'bg-slate-300' },
                { label: '2. Contactados / En Análisis', value: funnel.contactados, color: 'bg-blue-400' },
                { label: '3. Presupuesto Enviado', value: funnel.presupuestos, color: 'bg-orange-400' },
                { label: '4. Ganados (Cerrados)', value: funnel.ganados, color: 'bg-green-500' }
              ].map((step, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                    <span>{step.label}</span>
                    <span>{step.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className={`${step.color} h-3 rounded-full transition-all`} style={{ width: `${(step.value / maxFunnel) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PERFORMANCE BY SELLER */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              🏆 Rendimiento por Asesor
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="pb-3 font-bold">Asesor</th>
                    <th className="pb-3 font-bold text-center">Abiertos</th>
                    <th className="pb-3 font-bold text-center">Cerrados</th>
                    <th className="pb-3 font-bold text-right">Facturación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sellersPerformance.map(seller => (
                    <tr key={seller.id}>
                      <td className="py-3">
                        <div className="font-bold text-slate-800">{seller.name}</div>
                        <div className="text-xs text-slate-500 font-medium">Conv: {seller.winRate}%</div>
                      </td>
                      <td className="py-3 text-center font-medium text-blue-600">{seller.open}</td>
                      <td className="py-3 text-center font-medium text-green-600">{seller.won}</td>
                      <td className="py-3 text-right font-black text-slate-800">${seller.revenue.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                  {sellersPerformance.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 font-medium">No hay datos de vendedores</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24 space-y-8">
      

      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard, {currentUser.name}</h1>
        <p className="text-slate-500 font-medium mt-1">Resumen de tu actividad y oportunidades abiertas.</p>
      </header>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-5 rounded-2xl shadow-sm border border-blue-200">
          <div className="text-blue-600 font-bold text-xs tracking-wider mb-1">NUEVOS (HOY)</div>
          <div className="text-4xl font-black text-blue-700">{nuevosLeads.length}</div>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-200">
          <div className="text-red-600 font-bold text-xs tracking-wider mb-1">ATRASADOS</div>
          {seguimientosAtrasados.length === 0 ? (
            <div className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1">¡Al día! ✨</div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-red-900">{seguimientosAtrasados.length}</div>
            </div>
          )}
        </div>
        <div className="bg-orange-50 p-5 rounded-2xl shadow-sm border border-orange-200">
          <div className="text-orange-600 font-bold text-xs tracking-wider mb-1">HOT LEADS</div>
          <div className="text-4xl font-black text-orange-700">{oportunidadesCalientes.length}</div>
        </div>
        <div className="bg-purple-50 p-5 rounded-2xl shadow-sm border border-purple-200">
          <div className="text-purple-600 font-bold text-xs tracking-wider mb-1">ALARMAS (INTERESADOS)</div>
          <div className="text-4xl font-black text-purple-700">{alarmasInteresados.length}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        <div className="space-y-6">
          
          {/* SEGUIMIENTOS DE HOY */}
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <span>📅</span> Seguimientos de Hoy
            </h2>
            <div className="space-y-3">
              {seguimientosHoy.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center text-slate-500 text-sm font-medium">¡Estás al día! No hay seguimientos para hoy.</div>
              ) : seguimientosHoy.map(opp => (
                <a key={opp.id} href={`/opportunities/${opp.id}`} className="block bg-white p-4 rounded-xl shadow-sm border border-blue-200 border-l-4 border-l-blue-500 hover:border-blue-400 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">{opp.customer.name}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${opp.priority === 'ALTA' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{opp.priority}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600 mb-2">{opp.nextAction || 'Sin acción definida'}</div>
                  <div className="flex gap-2 text-xs font-bold text-slate-400">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{opp.status}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* SEGUIMIENTOS ATRASADOS */}
          {seguimientosAtrasados.length > 0 && (
            <div>
              <h2 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>⚠️</span> Seguimientos Atrasados
              </h2>
              <div className="space-y-3">
                {seguimientosAtrasados.map(opp => (
                  <a key={opp.id} href={`/opportunities/${opp.id}`} className="block bg-white p-4 rounded-xl shadow-sm border border-red-200 border-l-4 border-l-red-500 hover:border-red-400 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800">{opp.customer.name}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${opp.priority === 'ALTA' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{opp.priority}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-600 mb-2">{opp.nextAction || 'Sin acción definida'}</div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">{opp.status}</span>
                      <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full">Atrasado: {opp.nextFollowUp ? format(new Date(opp.nextFollowUp), 'dd/MM/yyyy') : ''}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <span>🚀</span> Nuevos Leads (Sin gestionar)
            </h2>
            <div className="space-y-3">
              {nuevosLeads.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center text-slate-500 text-sm font-medium">No hay leads nuevos sin gestionar.</div>
              ) : nuevosLeads.map(opp => (
                <a key={opp.id} href={`/opportunities/${opp.id}`} className="block bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{opp.customer.name}</div>
                      <div className="text-sm font-medium text-slate-500">{opp.customer.phone}</div>
                    </div>
                    <span className="text-xs bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm">GESTIONAR ➔</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-orange-600 mb-4 flex items-center gap-2">
              <span>🔥</span> Oportunidades Calientes
            </h2>
            <div className="space-y-3">
              {oportunidadesCalientes.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center text-slate-500 text-sm font-medium">No hay oportunidades calientes abiertas.</div>
              ) : oportunidadesCalientes.map(opp => (
                <a key={opp.id} href={`/opportunities/${opp.id}`} className="block bg-white p-4 rounded-xl shadow-sm border border-orange-200 hover:border-orange-400 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">{opp.customer.name}</span>
                    <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded">HOT</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 mb-2">Necesidad: {opp.needDescription || opp.productInterest}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold">{opp.status}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-purple-700 mb-4 flex items-center gap-2">
              <span>🛡️</span> Embudo de Alarmas
            </h2>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-medium text-slate-600">Interés Alto/Medio</span>
                <span className="font-black text-xl text-purple-700">{alarmasInteresados.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-medium text-slate-600">Contactados</span>
                <span className="font-black text-xl text-slate-800">{alarmOpps.filter(a => a.status !== 'SIN_CALIFICAR').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-600">Instalaciones Vendidas</span>
                <span className="font-black text-xl text-green-600">{alarmOpps.filter(a => a.status === 'GANADO').length}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
