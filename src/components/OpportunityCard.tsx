import Link from 'next/link';
import { format } from 'date-fns';

export function OpportunityCard({ opportunity, highlight, atraso }: { opportunity: any, highlight?: 'red' | 'yellow', atraso?: number }) {
  const statusColors: any = {
    'Nuevo': 'bg-blue-100 text-blue-700',
    'Contactar': 'bg-orange-100 text-orange-700',
    'Presupuesto enviado': 'bg-purple-100 text-purple-700',
    'Seguimiento': 'bg-yellow-100 text-yellow-700',
    'Negociación': 'bg-indigo-100 text-indigo-700',
    'Venta concretada': 'bg-green-100 text-green-700',
    'Venta perdida': 'bg-slate-100 text-slate-700',
  };

  const bgClass = highlight === 'red' ? 'bg-red-50 border-red-200' : highlight === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200';

  return (
    <Link href={`/opportunities/${opportunity.id}`} className={`block rounded-2xl shadow-sm border p-4 hover:shadow-md transition-shadow ${bgClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{opportunity.customer.name}</h3>
          <p className="text-slate-500 text-sm">📱 {opportunity.customer.phone}</p>
        </div>
        <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
          {opportunity.user.initials}
        </div>
      </div>
      
      <div className="mb-3">
        <span className="font-medium text-slate-700">{opportunity.productInterest}</span>
        {opportunity.productModel && <span className="text-slate-500 text-sm ml-1">({opportunity.productModel})</span>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${statusColors[opportunity.status] || 'bg-slate-100'}`}>
            {opportunity.status}
          </span>
          
          {atraso ? (
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-red-100 text-red-700">
              Atrasado {atraso} {atraso === 1 ? 'día' : 'días'}
            </span>
          ) : opportunity.nextFollowUp ? (
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
              📅 {format(new Date(opportunity.nextFollowUp), 'dd/MM/yyyy')}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
