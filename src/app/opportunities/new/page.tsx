'use client';

import { useState } from 'react';
import { createOpportunityAction } from './actions';
import { useRouter } from 'next/navigation';

export default function NewOpportunityPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Nuevo');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    
    try {
      // Usamos wrapper action para manejar redirect y errores sin try/catch anidado complejo
      await createOpportunityAction(formData);
    } catch (err: any) {
      setError(err.message || 'Error al crear la oportunidad');
      setLoading(false);
    }
  };

  const nextFollowUpRequired = !['Venta concretada', 'Venta perdida'].includes(status);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4">
      <h1 className="text-2xl font-bold mb-6">+ Nueva Oportunidad</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-bold text-slate-800 border-b pb-2">Datos del Cliente</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre y Apellido</label>
            <input required type="text" name="name" className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Ej. Juan Pérez" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (WhatsApp)</label>
            <input required type="tel" name="phone" className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="351 123 4567" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
            <select name="origin" className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500">
              <option value="Stand">Stand</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Referido">Referido</option>
              <option value="Cliente anterior">Cliente anterior</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-bold text-slate-800 border-b pb-2">Interés Comercial</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Producto de Interés</label>
            <select name="productInterest" className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500">
              <option value="Cámara">Cámara</option>
              <option value="Kit de cámaras">Kit de cámaras</option>
              <option value="Alarma">Alarma (Monitoreada)</option>
              <option value="Cerradura">Cerradura inteligente</option>
              <option value="Videoportero">Videoportero</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select name="status" value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Próximo Seguimiento {nextFollowUpRequired && <span className="text-red-500">*</span>}</label>
            <input 
              type="date" 
              name="nextFollowUp" 
              required={nextFollowUpRequired}
              className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" 
            />
            {nextFollowUpRequired && <p className="text-xs text-slate-500 mt-1">Obligatorio para no olvidar al cliente.</p>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold text-lg p-4 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'GUARDAR OPORTUNIDAD'}
        </button>
      </form>
    </div>
  );
}
