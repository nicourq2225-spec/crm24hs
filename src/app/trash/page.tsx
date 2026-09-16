import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { OpportunityCard } from '@/components/OpportunityCard';

export const dynamic = 'force-dynamic';

export default async function TrashPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/login');

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) redirect('/login');

  // Sólo traer las de estado 'Papelera'
  const trashOpportunities = await prisma.opportunity.findMany({
    where: {
      status: 'Papelera',
      ...(currentUser.role !== 'ADMIN' ? { userId: currentUser.id } : {})
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
            <span className="text-3xl">🗑️</span> Papelera
          </h1>
          <p className="text-slate-500 mt-1">Clientes eliminados. Están ocultos del dashboard y las vistas principales.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {trashOpportunities.length === 0 ? (
          <p className="text-slate-500 col-span-full bg-white p-6 text-center rounded-xl border border-slate-200">La papelera está vacía.</p>
        ) : (
          trashOpportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))
        )}
      </div>
    </div>
  );
}
