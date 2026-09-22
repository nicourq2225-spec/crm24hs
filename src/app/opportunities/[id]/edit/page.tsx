import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { editCustomerAction } from '../actions';
import { EditCustomerForm } from '@/components/Forms';

export const dynamic = 'force-dynamic';

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/login');

  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!opportunity) {
    return <div className="p-8 text-center">Oportunidad no encontrada</div>;
  }

  // Wrappear la Server Action con el ID pre-aplicado
  const updateAction = async (formData: FormData) => {
    'use server';
    await editCustomerAction(id, formData);
    redirect(`/opportunities/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <a href={`/opportunities/${id}`} className="text-blue-600 font-medium hover:underline text-sm flex items-center">
          ← Cancelar
        </a>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">✏️ Editar Cliente</h1>
        
        <EditCustomerForm opportunity={opportunity} action={updateAction} />
      </div>
    </div>
  );
}
