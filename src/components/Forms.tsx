'use client';

import { useState } from 'react';
import { addFollowUpAction, updateEconomicInfoAction, updateAlarmInfoAction } from '@/app/opportunities/[id]/actions';
import { useRouter } from 'next/navigation';

export function AddFollowUpForm({ opportunityId, currentStatus }: { opportunityId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await addFollowUpAction(opportunityId, new FormData(e.currentTarget));
      // Reset form
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const nextFollowUpRequired = !['Venta concretada', 'Venta perdida'].includes(status);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h3 className="font-bold text-lg mb-2 border-b pb-2 text-slate-800">📋 Agregar Seguimiento</h3>
      
      {error && <div className="text-red-600 bg-red-50 p-2 rounded text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Comentario</label>
        <textarea required name="comment" rows={3} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" placeholder="¿Qué se habló con el cliente?" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo Estado</label>
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500">
          <option value="Nuevo">🆕 Nuevo</option>
          <option value="Contactar">📞 Contactar</option>
          <option value="Presupuesto enviado">💰 Presupuesto enviado</option>
          <option value="Seguimiento">🔔 Seguimiento</option>
          <option value="Negociación">🤝 Negociación</option>
          <option value="Venta concretada">✅ Venta concretada</option>
          <option value="Venta perdida">❌ Venta perdida</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Próximo Seguimiento {nextFollowUpRequired && <span className="text-red-500">*</span>}
        </label>
        <input 
          type="date" 
          name="nextFollowUp" 
          required={nextFollowUpRequired}
          className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" 
        />
      </div>

      <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Guardando...' : 'GUARDAR SEGUIMIENTO'}
      </button>
    </form>
  );
}

export function EconomicInfoForm({ opportunity }: { opportunity: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await updateEconomicInfoAction(opportunity.id, new FormData(e.currentTarget));
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500">Modelo específico</label>
        <input type="text" name="productModel" defaultValue={opportunity.productModel || ''} className="w-full p-2 border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent" placeholder="Ej. H9C" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Valor Presupuesto ($)</label>
        <input type="number" name="budgetValue" defaultValue={opportunity.budgetValue || ''} className="w-full p-2 border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent" placeholder="0.00" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Forma de Pago</label>
        <select name="paymentMethod" defaultValue={opportunity.paymentMethod || ''} className="w-full p-2 border-b border-slate-200 outline-none bg-transparent">
          <option value="">Seleccionar...</option>
          <option value="Transferencia / efectivo">Transferencia / efectivo</option>
          <option value="Débito">Débito</option>
          <option value="Crédito">Crédito</option>
          <option value="Cuotas">Cuotas</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Cant. Cuotas</label>
        <input type="number" name="installments" defaultValue={opportunity.installments || ''} className="w-full p-2 border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent" placeholder="Ej. 3" />
      </div>
      <button disabled={loading} type="submit" className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50">
        Guardar datos económicos
      </button>
    </form>
  );
}

export function AlarmInfoForm({ opportunity }: { opportunity: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await updateAlarmInfoAction(opportunity.id, new FormData(e.currentTarget));
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500">¿Tiene alarma?</label>
        <select name="hasAlarm" defaultValue={opportunity.hasAlarm || 'No sabe'} className="w-full p-2 border-b border-slate-200 outline-none bg-transparent">
          <option value="Sí">Sí</option>
          <option value="No">No</option>
          <option value="No sabe">No sabe</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Oportunidad de Alarma</label>
        <select name="alarmOpportunity" defaultValue={opportunity.alarmOpportunity || 'No'} className="w-full p-2 border-b border-slate-200 outline-none bg-transparent">
          <option value="No">🔴 No</option>
          <option value="Potencial">🟡 Potencial</option>
          <option value="Ofrecer">🟢 Ofrecer</option>
        </select>
      </div>
      <button disabled={loading} type="submit" className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50">
        Guardar info alarma
      </button>
    </form>
  );
}
