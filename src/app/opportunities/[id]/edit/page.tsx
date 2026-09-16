import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { editCustomerAction } from '../actions';

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
        
        <form action={updateAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={opportunity.customer.name} 
              required
              className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input 
              type="text" 
              name="phone" 
              defaultValue={opportunity.customer.phone} 
              required
              className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Producto de Interés principal</label>
            <input 
              type="text" 
              name="productInterest" 
              defaultValue={opportunity.productInterest} 
              required
              className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" 
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700">
              GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
