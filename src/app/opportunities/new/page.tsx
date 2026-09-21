'use client';

import { useState } from 'react';
import { createOpportunityAction } from './actions';

export default function NewOpportunityPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    
    try {
      await createOpportunityAction(formData);
    } catch (err: any) {
      setError(err.message || 'Error al crear la oportunidad');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4">
      <h1 className="text-2xl font-bold mb-6">+ Nuevo Cliente</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
            <input required type="text" name="name" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Ej. Juan Pérez" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp</label>
            <input required type="tel" name="phone" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="351 123 4567" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Cliente</label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="PARTICULAR" className="peer sr-only" defaultChecked />
                <div className="p-3 text-center rounded-xl border border-slate-200 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 font-medium transition-all">
                  🏠 Particular
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="NEGOCIO" className="peer sr-only" />
                <div className="p-3 text-center rounded-xl border border-slate-200 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 font-medium transition-all">
                  🏪 Negocio
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Qué necesita (Resumen)</label>
            <input required type="text" name="needDescription" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Ej. Quiere controlar el patio y la entrada" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Producto Principal</label>
            <select name="productInterest" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
              <option value="Cámara">Cámara de seguridad</option>
              <option value="Kit de cámaras">Kit de múltiples cámaras</option>
              <option value="Cerradura">Cerradura inteligente</option>
              <option value="Videoportero">Videoportero</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">¿Cuándo piensa comprar?</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="urgency" value="HOY" className="peer sr-only" />
                <div className="p-2 text-sm text-center rounded-lg border border-slate-200 peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 font-medium transition-all">
                  🔥 Hoy
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="urgency" value="ESTA_SEMANA" className="peer sr-only" defaultChecked />
                <div className="p-2 text-sm text-center rounded-lg border border-slate-200 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700 font-medium transition-all">
                  ⚡ Esta semana
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="urgency" value="ESTE_MES" className="peer sr-only" />
                <div className="p-2 text-sm text-center rounded-lg border border-slate-200 peer-checked:border-yellow-500 peer-checked:bg-yellow-50 peer-checked:text-yellow-700 font-medium transition-all">
                  📅 Este mes
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="urgency" value="MAS_ADELANTE" className="peer sr-only" />
                <div className="p-2 text-sm text-center rounded-lg border border-slate-200 peer-checked:border-slate-500 peer-checked:bg-slate-50 peer-checked:text-slate-700 font-medium transition-all">
                  ⏳ Más adelante
                </div>
              </label>
            </div>
          </div>
          
          <input type="hidden" name="origin" value="Stand" />

        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white font-black text-lg p-5 rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all transform active:scale-95"
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR Y PREPARAR SEGUIMIENTO'}
        </button>
      </form>
    </div>
  );
}
