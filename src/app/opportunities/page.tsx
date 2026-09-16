import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { OpportunityCard } from '@/components/OpportunityCard';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) redirect('/login');

  const params = await searchParams;
  const filter = params?.filter || 'all';
  const q = params?.q || '';

  let whereClause: any = { status: { not: 'Papelera' } };

  if (currentUser.role !== 'ADMIN') {
    whereClause.userId = currentUser.id;
  } else if (filter === 'my') {
    whereClause.userId = currentUser.id;
  }

  if (q) {
    whereClause.OR = [
      { customer: { name: { contains: q } } },
      { customer: { phone: { contains: q } } },
      { productInterest: { contains: q } },
      { productModel: { contains: q } },
    ];
  }

  // Handle specific filters
  if (filter === 'negociacion') {
    whereClause.status = 'Negociación';
  } else if (filter === 'presupuestos') {
    whereClause.status = 'Presupuesto enviado';
  } else if (filter === 'ganadas') {
    whereClause.status = 'Venta concretada';
  } else if (filter === 'perdidas') {
    whereClause.status = 'Venta perdida';
  }

  const opportunities = await prisma.opportunity.findMany({
    where: whereClause,
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
        <h1 className="text-2xl font-bold">Oportunidades</h1>
        <a href="/opportunities/new" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-700 text-center w-full md:w-auto">
          + NUEVA
        </a>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <form className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, teléfono, producto..."
            className="w-full p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </form>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <a href="/opportunities" className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold border ${filter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            Todas
          </a>
          {currentUser.role === 'ADMIN' && (
            <a href="/opportunities?filter=my" className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold border ${filter === 'my' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Mis clientes
            </a>
          )}
          <a href="/opportunities?filter=negociacion" className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold border ${filter === 'negociacion' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            Negociaciones
          </a>
          <a href="/opportunities?filter=ganadas" className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold border ${filter === 'ganadas' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            Concretadas
          </a>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.length === 0 ? (
          <p className="text-slate-500 col-span-full">No se encontraron oportunidades.</p>
        ) : (
          opportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))
        )}
      </div>
    </div>
  );
}
