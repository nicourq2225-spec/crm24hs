import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { OpportunityCard } from '@/components/OpportunityCard';
import { differenceInDays, isToday, isPast, startOfDay, startOfMonth, endOfMonth, parse, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/login');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) {
    redirect('/login');
  }

  const params = await searchParams;
  const monthFilter = params?.month || 'all';

  let dateFilter = {};
  if (monthFilter !== 'all') {
    const targetDate = parse(monthFilter, 'yyyy-MM', new Date());
    dateFilter = {
      createdAt: {
        gte: startOfMonth(targetDate),
        lte: endOfMonth(targetDate)
      }
    };
  }

  // Fetch opportunities depending on role
  const opportunities = await prisma.opportunity.findMany({
    where: {
      status: { not: 'Papelera' },
      ...(currentUser.role === 'ADMIN' ? {} : { userId: currentUser.id }),
      ...dateFilter
    },
    include: {
      customer: true,
      user: true,
    },
    orderBy: {
      nextFollowUp: 'asc',
    },
  });

  // Calculate stats
  const totalOpps = opportunities.length;
  const oppsBySeller = opportunities.reduce((acc, opp) => {
    acc[opp.user.initials] = (acc[opp.user.initials] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pipelineCount = opportunities.reduce((acc, opp) => {
    acc[opp.status] = (acc[opp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const today = startOfDay(new Date());

  const todayFollowUps = opportunities.filter((opp) => 
    opp.nextFollowUp && isToday(opp.nextFollowUp) && !['Venta concretada', 'Venta perdida'].includes(opp.status)
  );

  const overdueFollowUps = opportunities.filter((opp) => 
    opp.nextFollowUp && isPast(opp.nextFollowUp) && !isToday(opp.nextFollowUp) && !['Venta concretada', 'Venta perdida'].includes(opp.status)
  );

  const valueVentas = opportunities
    .filter(o => o.status === 'Venta concretada')
    .reduce((acc, o) => acc + (o.budgetValue || 0), 0);
  
  const valuePresupuestos = opportunities
    .filter(o => !['Venta concretada', 'Venta perdida'].includes(o.status))
    .reduce((acc, o) => acc + (o.budgetValue || 0), 0);

  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');
  const lastMonthStr = format(subMonths(now, 1), 'yyyy-MM');

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20 md:pb-4 space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">CRM {currentUser.role === 'ADMIN' ? 'General' : currentUser.name}</h1>
        
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex gap-2 shrink-0">
            <a href="/?month=all" className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-semibold border transition-colors ${monthFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Todos
            </a>
            <a href={`/?month=${currentMonthStr}`} className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-semibold border transition-colors ${monthFilter === currentMonthStr ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Este mes
            </a>
            <a href={`/?month=${lastMonthStr}`} className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-semibold border transition-colors ${monthFilter === lastMonthStr ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Mes pasado
            </a>
          </div>
          <a href="/opportunities/new" className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-700 shrink-0 whitespace-nowrap">
            + NUEVO
          </a>
        </div>
      </div>

      <form action="/opportunities" method="GET" className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input 
          type="text" 
          name="q" 
          placeholder="Buscar un cliente, teléfono o producto rápidamente..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm font-semibold">Total Oport.</span>
          <span className="text-3xl font-bold text-slate-800">{totalOpps}</span>
        </div>
        <div className="bg-yellow-50 p-4 rounded-2xl shadow-sm border border-yellow-100 flex flex-col items-center justify-center">
          <span className="text-yellow-700 text-sm font-semibold">🔔 Hoy</span>
          <span className="text-3xl font-bold text-yellow-800">{todayFollowUps.length}</span>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center">
          <span className="text-red-700 text-sm font-semibold">⚠️ Atrasados</span>
          <span className="text-3xl font-bold text-red-800">{overdueFollowUps.length}</span>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center">
          <span className="text-green-700 text-sm font-semibold">✅ Ventas</span>
          <span className="text-3xl font-bold text-green-800">{pipelineCount['Venta concretada'] || 0}</span>
        </div>
      </div>

      {currentUser.role === 'ADMIN' && (
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
          <h2 className="text-sm font-bold text-slate-500 mb-4">👥 OPORTUNIDADES POR VENDEDOR</h2>
          <div className="flex gap-6 overflow-x-auto">
            {Object.entries(oppsBySeller).map(([initials, count]) => (
              <div key={initials} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {initials}
                </div>
                <span className="mt-2 text-xl font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widget Seguimientos de Hoy */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
          <span className="text-2xl">🔔</span> SEGUIMIENTOS DE HOY
        </h2>
        {todayFollowUps.length === 0 ? (
          <p className="text-slate-500 italic bg-white p-4 rounded-xl text-center shadow-sm">No hay seguimientos programados para hoy.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todayFollowUps.map(opp => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>

      {/* Widget Atrasados */}
      {overdueFollowUps.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-3">
            <span className="text-2xl">⚠️</span> SEGUIMIENTOS ATRASADOS
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {overdueFollowUps.map(opp => {
              const days = differenceInDays(today, startOfDay(new Date(opp.nextFollowUp!)));
              return (
                <OpportunityCard key={opp.id} opportunity={opp} highlight="red" atraso={days} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
