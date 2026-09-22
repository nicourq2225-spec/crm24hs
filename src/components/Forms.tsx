'use client';

import { useState, startTransition } from 'react';
import { addFollowUpAction, updateQualificationAction, updateAlarmInfoAction } from '@/app/opportunities/[id]/actions';
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
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const isClosed = ['GANADO', 'PERDIDO'].includes(status);
  const isLost = status === 'PERDIDO';

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h3 className="font-bold text-lg mb-2 border-b pb-2 text-slate-800">📝 Registrar Seguimiento</h3>
      
      {error && <div className="text-red-600 bg-red-50 p-2 rounded text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Resultado de la interacción</label>
        <textarea required name="comment" rows={3} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" placeholder="¿Qué se habló con el cliente?" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input type="checkbox" id="isEffectiveContact" name="isEffectiveContact" value="true" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
        <label htmlFor="isEffectiveContact" className="text-sm text-slate-700">Fue un contacto efectivo (el cliente respondió)</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Mover a Etapa</label>
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500">
          <option value="NUEVO">NUEVO</option>
          <option value="CONTACTADO">CONTACTADO</option>
          <option value="NECESIDAD_IDENTIFICADA">NECESIDAD IDENTIFICADA</option>
          <option value="PROPUESTA_ENVIADA">PROPUESTA ENVIADA</option>
          <option value="SEGUIMIENTO">SEGUIMIENTO</option>
          <option value="NUTRICION">NUTRICIÓN</option>
          <option value="GANADO">✅ GANADO</option>
          <option value="PERDIDO">❌ PERDIDO</option>
        </select>
      </div>

      {isLost && (
        <div className="space-y-3 bg-red-50 p-4 rounded-xl border border-red-100">
          <div>
            <label className="block text-sm font-bold text-red-800 mb-1">Motivo de Pérdida</label>
            <select name="lossReason" required className="w-full p-2 rounded border border-red-200 outline-none">
              <option value="">Seleccionar...</option>
              <option value="Precio">Precio alto</option>
              <option value="Compró en otro lugar">Compró en otro lugar</option>
              <option value="Postergó">Postergó la compra</option>
              <option value="No necesitaba">No necesitaba realmente</option>
              <option value="Falta de stock">Falta de stock</option>
              <option value="No respondió">Dejó de responder</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-red-800 mb-1">Observaciones</label>
            <input type="text" name="lossObservation" className="w-full p-2 rounded border border-red-200 outline-none" placeholder="Opcional..." />
          </div>
        </div>
      )}

      {!isClosed && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Acción Obligatoria</label>
            <input type="text" required name="nextAction" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="Ej: Llamar para confirmar si vio el PDF" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha de Próxima Acción <span className="text-red-500">*</span>
            </label>
            <input 
              type="date" 
              name="nextFollowUp" 
              required
              className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500" 
            />
          </div>
        </>
      )}

      <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white font-bold p-4 rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 transition-all">
        {loading ? 'Guardando...' : 'GUARDAR SEGUIMIENTO'}
      </button>
    </form>
  );
}

export function QualificationForm({ opportunity }: { opportunity: any }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    await updateQualificationAction(opportunity.id, new FormData(e.currentTarget));
    startTransition(() => {
      router.refresh();
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const targets = opportunity.qTargets || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative">
      {saved && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce text-sm flex items-center gap-2 z-50">
          <span>✅</span> Guardado correctamente
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">¿Para dónde la necesitás?</label>
          <select name="qLocation" defaultValue={opportunity.qLocation || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Casa">Casa</option>
            <option value="Negocio">Negocio</option>
            <option value="Depósito">Depósito</option>
            <option value="Exterior">Exterior general</option>
            <option value="Interior">Interior general</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">¿Qué querés controlar?</label>
          <div className="flex flex-wrap gap-2 text-sm">
            {['Entrada', 'Patio', 'Cochera', 'Caja', 'Salón', 'Depósito', 'Personas', 'Vehículo'].map(t => (
              <label key={t} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded cursor-pointer hover:bg-blue-50">
                <input type="checkbox" name="qTargets" value={t} defaultChecked={targets.includes(t)} />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">¿Ya tenés cámaras?</label>
          <select name="qHasCameras" defaultValue={opportunity.qHasCameras || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Primer sistema">Primer sistema</option>
            <option value="Ya tiene cámaras">Ya tiene cámaras</option>
            <option value="Quiere ampliar">Quiere ampliar</option>
            <option value="Quiere reemplazar">Quiere reemplazar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zonas a cubrir</label>
          <select name="qZones" defaultValue={opportunity.qZones || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
            <option value="No definido">No definido</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">¿Mirar desde el celular?</label>
          <select name="qMobileAccess" defaultValue={opportunity.qMobileAccess || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
            <option value="No sabe">No sabe</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">¿Instalación?</label>
          <select name="qInstallRequired" defaultValue={opportunity.qInstallRequired || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Solo equipo">Solo equipo</option>
            <option value="Equipo + instalación">Equipo + instalación</option>
            <option value="No sabe">No sabe</option>
          </select>
        </div>
      </div>
      
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-sm font-bold text-blue-800 mb-1">💡 Solución Recomendada</label>
        <select name="recommendedSolution" defaultValue={opportunity.recommendedSolution || ''} className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50 outline-none font-medium">
          <option value="">Seleccionar Combo...</option>
          <option value="Solución Casa">Solución Casa</option>
          <option value="Solución Negocio">Solución Negocio</option>
          <option value="Solución Entrada">Solución Entrada (VideoPortero/Cámara)</option>
          <option value="Solución Exterior">Solución Exterior</option>
          <option value="Solución Personalizada">Solución Personalizada</option>
        </select>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridad (Ajuste Manual)</label>
        <select name="priority" defaultValue="" className="w-1/2 p-2 rounded bg-slate-50 border border-slate-200 outline-none">
          <option value="">Dejar Automática</option>
          <option value="ALTA">🔴 Forzar Alta</option>
          <option value="MEDIA">🟡 Forzar Media</option>
          <option value="BAJA">🟢 Forzar Baja</option>
        </select>
      </div>

      <button disabled={loading} type="submit" className="text-sm bg-slate-100 px-4 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
        {loading ? 'Guardando...' : 'Guardar Calificación y Analizar'}
      </button>
    </form>
  );
}

export function AlarmInfoForm({ alarmOpportunity, customerId, opportunityId }: { alarmOpportunity: any, customerId: string, opportunityId: string }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    await updateAlarmInfoAction(customerId, opportunityId, new FormData(e.currentTarget));
    startTransition(() => {
      router.refresh();
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const opp = alarmOpportunity || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {saved && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce text-sm flex items-center gap-2 z-50">
          <span>✅</span> Guardado correctamente
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500">¿Tiene alarma?</label>
          <select name="hasAlarm" defaultValue={opp.hasAlarm || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Sí">Sí, tiene alarma</option>
            <option value="No">No tiene alarma</option>
            <option value="Tenía">Tenía alarma anteriormente</option>
            <option value="No sabe">No sabe / No seguro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">¿Le interesaría Monitoreo?</label>
          <select name="monitoringInterest" defaultValue={opp.monitoringInterest || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Interesado">Sí, está interesado</option>
            <option value="Quiere info">Quiere saber cómo funciona</option>
            <option value="Evaluando">Lo está evaluando</option>
            <option value="No interesado">No le interesa</option>
            <option value="Más adelante">Más adelante</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Nivel de Interés Global</label>
          <select name="interestLevel" defaultValue={opp.interestLevel || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
            <option value="No interesado">No interesado</option>
            <option value="Sin calificar">Sin calificar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Inmueble a proteger</label>
          <select name="propertyType" defaultValue={opp.propertyType || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none">
            <option value="">Seleccionar...</option>
            <option value="Casa">Casa</option>
            <option value="Depto">Departamento</option>
            <option value="Negocio">Negocio</option>
            <option value="Depósito">Depósito</option>
            <option value="Oficina">Oficina</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Próxima Acción (Alarma)</label>
        <input type="text" name="nextAction" defaultValue={opp.nextAction || ''} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" placeholder="Ej: Enviar PDF explicativo de monitoreo" />
      </div>
      <button disabled={loading} type="submit" className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg disabled:opacity-50">
        {loading ? 'Guardando...' : 'Actualizar Datos de Alarma'}
      </button>
    </form>
  );
}

export function ProposalDetailsForm({ opportunity }: { opportunity: any }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const { updateProposalDetailsAction } = await import('@/app/opportunities/[id]/actions');
    await updateProposalDetailsAction(opportunity.id, new FormData(e.currentTarget));
    startTransition(() => {
      router.refresh();
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {saved && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce text-sm flex items-center gap-2 z-50">
          <span>✅</span> Guardado correctamente
        </div>
      )}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Productos y Cantidades</label>
        <textarea name="proposalProducts" defaultValue={opportunity.proposalProducts || ''} rows={3} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" placeholder="Ej: 4x Cámaras Bullet Full Color 2MP\n1x DVR 4 Canales\n1x Disco Rígido 1TB" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Beneficios Extras para el Cliente</label>
        <textarea name="proposalBenefits" defaultValue={opportunity.proposalBenefits || ''} rows={2} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" placeholder="Ej: Visión nocturna a color 24hs. Garantía de 2 años." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presupuesto ($)</label>
          <input type="number" name="budgetValue" defaultValue={opportunity.budgetValue || ''} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Forma de Pago</label>
          <input type="text" name="paymentMethod" defaultValue={opportunity.paymentMethod || ''} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" placeholder="Ej: Transferencia / 3 Cuotas" />
        </div>
      </div>
      <button disabled={loading} type="submit" className="text-sm bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-all flex items-center gap-2">
        {loading ? (
          <><span>⏳</span> Guardando...</>
        ) : (
          <><span>💾</span> Guardar Detalles de Propuesta</>
        )}
      </button>
    </form>
  );
}

export function EditCustomerForm({ opportunity, action }: { opportunity: any, action: any }) {
  const [loading, setLoading] = useState(false);
  
  return (
    <form action={async (formData) => {
      setLoading(true);
      await action(formData);
    }} className="space-y-4">
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (WhatsApp)</label>
        <input 
          type="text" 
          name="phone" 
          defaultValue={opportunity.customer.phone} 
          required
          className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cliente</label>
        <select name="type" defaultValue={opportunity.customer.type || 'PARTICULAR'} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500">
          <option value="PARTICULAR">Particular</option>
          <option value="NEGOCIO">Negocio</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Qué necesita (Resumen Rápido)</label>
        <input 
          type="text" 
          name="quickNeed" 
          defaultValue={opportunity.quickNeed || ''}
          className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Producto Principal</label>
        <select name="productInterest" defaultValue={opportunity.productInterest || 'Cámara de seguridad'} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500">
          <option value="Cámara de seguridad">Cámara de seguridad</option>
          <option value="Kit Cámaras">Kit Cámaras</option>
          <option value="Cerradura Inteligente">Cerradura Inteligente</option>
          <option value="Videoportero">Videoportero</option>
          <option value="Alarma">Alarma</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">¿Cuándo piensa comprar? (Urgencia)</label>
        <select name="urgency" defaultValue={opportunity.urgency || 'ESTA_SEMANA'} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500">
          <option value="HOY">🔥 Hoy</option>
          <option value="ESTA_SEMANA">⚡ Esta semana</option>
          <option value="ESTE_MES">📅 Este mes</option>
          <option value="MAS_ADELANTE">⏳ Más adelante</option>
        </select>
      </div>
      <div className="pt-4">
        <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {loading ? (
            <><span>⏳</span> GUARDANDO...</>
          ) : (
            <><span>💾</span> GUARDAR CAMBIOS</>
          )}
        </button>
      </div>
    </form>
  );
}
