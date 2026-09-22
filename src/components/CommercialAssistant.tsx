'use client';

import { useState } from 'react';

export function CommercialAssistant({ opportunity, alarmOpp }: { opportunity: any, alarmOpp: any }) {
  const { customer, qLocation, qZones, qMobileAccess, qInstallRequired, qTargets, qHasCameras, urgency, status, priority, recommendedSolution } = opportunity;
  const isBusiness = customer.type === 'NEGOCIO';

  // --- MOTOR DE INTERPRETACIÓN ---

  // 1. Resumen
  const targetsTxt = qTargets && qTargets.length > 0 ? qTargets.join(', ') : 'zonas no especificadas';
  let summary = `Cliente necesita una solución de seguridad para ${qLocation || 'su propiedad'}, enfocada en controlar ${targetsTxt}. `;
  if (qZones) summary += `Requiere cubrir aprox. ${qZones} zonas. `;
  if (qMobileAccess === 'Sí') summary += `Necesita acceso remoto desde el celular. `;
  if (qInstallRequired === 'Equipo + instalación') summary += `Requiere servicio de instalación.`;

  // 2. Solución sugerida
  let suggestedSolution = 'Solución Personalizada';
  if (qLocation === 'Exterior') suggestedSolution = 'Solución Exterior';
  else if (qTargets?.includes('Entrada') && qZones === '1') suggestedSolution = 'Solución Entrada';
  else if (isBusiness) {
    if (qZones === '3' || qZones === '4' || qZones === '5+') suggestedSolution = 'PROYECTO';
    else suggestedSolution = 'Solución Negocio';
  } else {
    if (qZones === '1') suggestedSolution = 'Solución Casa (Cámara individual)';
    else if (qZones && qZones !== 'No definido') suggestedSolution = 'Solución Casa Multizona';
  }

  // 3. Prioridad Automática
  let autoPriority = 'BAJA';
  const isAlarmHot = alarmOpp && (alarmOpp.monitoringInterest === 'Interesado' || alarmOpp.interestLevel === 'Alto');
  
  if (urgency === 'HOY' || urgency === 'ESTA_SEMANA' || (isBusiness && qZones >= '2') || qZones >= '3' || qInstallRequired === 'Equipo + instalación' || isAlarmHot) {
    autoPriority = 'ALTA';
  } else if (urgency === 'ESTE_MES' || qZones === '1' || qZones === '2') {
    autoPriority = 'MEDIA';
  }

  // 4. Oportunidades detectadas
  const detectedOpps = [];
  if (qInstallRequired === 'Equipo + instalación') {
    detectedOpps.push('🔧 Oportunidad de instalación detectada');
  }
  if (qHasCameras === 'Ya tiene cámaras') {
    detectedOpps.push('📷 Posible ampliación de sistema existente');
  }
  if (isBusiness && (qZones === '3' || qZones === '4' || qZones === '5+')) {
    detectedOpps.push('🏢 PROYECTO DE VIDEOVIGILANCIA');
  }
  if (alarmOpp?.hasAlarm === 'No') {
    if (alarmOpp.monitoringInterest === 'Interesado') {
      detectedOpps.push('🔐 OPORTUNIDAD DE ALARMA — ALTA');
    } else if (alarmOpp.monitoringInterest === 'Quiere info') {
      detectedOpps.push('🔐 OPORTUNIDAD DE ALARMA — MEDIA');
    }
  }

  const missingOpps = [];
  if (!qInstallRequired) {
    missingOpps.push('Preguntar si necesita instalación.');
  }
  if (!alarmOpp?.hasAlarm || alarmOpp.hasAlarm === 'No sabe / No seguro') {
    missingOpps.push('Preguntar si cuenta con alarma en la propiedad.');
  }

  // 5. Próxima acción sugerida
  let suggestedAction = 'Contactar al cliente para relevar necesidad.';
  if (status === 'NUEVO' || status === 'CONTACTADO') suggestedAction = 'Preparar y enviar propuesta personalizada.';
  else if (status === 'PROPUESTA_ENVIADA') suggestedAction = 'Realizar seguimiento de la propuesta enviada.';
  else if (urgency === 'HOY' || urgency === 'ESTA_SEMANA') suggestedAction = 'Contactar urgentemente para avanzar con la compra.';
  else if (detectedOpps.includes('🏢 PROYECTO DE VIDEOVIGILANCIA')) suggestedAction = 'Contactar para relevar proyecto en detalle.';
  else if (isAlarmHot) suggestedAction = 'Explicar servicio de monitoreo.';

  // 6. Mensaje de WhatsApp Automático
  const phoneFormatted = customer.phone.replace(/\D/g,'');
  const wsText = encodeURIComponent(`Hola ${customer.name}, estuve revisando lo que vimos sobre la seguridad de tu ${qLocation || 'propiedad'}. Por lo que necesitás cubrir (${targetsTxt}), te recomiendo avanzar con una ${suggestedSolution.replace('PROYECTO', 'solución integral')}. Te preparé una propuesta con las opciones que mejor se adaptan a lo que buscamos resolver. ¿Pudiste evaluarlo?`);

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
      
      <div className="absolute -right-6 -top-6 text-slate-800 opacity-20 transform rotate-12" style={{ fontSize: '10rem' }}>
        🧠
      </div>

      <div className="relative z-10 flex items-center justify-between border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <span>🧠</span> Resumen Comercial
        </h2>
        {autoPriority !== priority && (
          <span className="bg-slate-800 text-xs px-3 py-1 rounded-full font-bold text-slate-300 border border-slate-700">
            Prioridad actual: {priority} (Manual)
          </span>
        )}
      </div>

      <div className="relative z-10 grid md:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Necesidad Interpretada</span>
            <p className="text-slate-200 font-medium leading-relaxed">{summary}</p>
          </div>
          
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Solución Sugerida por el CRM</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl text-blue-400">{suggestedSolution}</span>
              {recommendedSolution !== suggestedSolution && (
                <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded font-bold transition-colors">
                  [Usar sugerencia]
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Oportunidades Detectadas</span>
            {detectedOpps.length > 0 ? (
              <ul className="space-y-2 mb-3">
                {detectedOpps.map((opp, i) => (
                  <li key={i} className="text-sm font-bold bg-slate-800 px-3 py-2 rounded-lg text-slate-200 border border-slate-700">
                    {opp}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-slate-500 text-sm italic block mb-3">Ninguna oportunidad extra detectada aún.</span>
            )}
            
            {missingOpps.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <span className="text-xs font-bold text-orange-400 block mb-1">⚠️ Falta relevar:</span>
                <ul className="list-disc list-inside text-sm text-orange-200">
                  {missingOpps.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Prioridad Automática</span>
              <span className={`font-black px-3 py-1 rounded text-sm ${autoPriority === 'ALTA' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : autoPriority === 'MEDIA' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-slate-700 text-slate-300'}`}>
                {autoPriority}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-slate-800 rounded-xl p-4 border border-slate-700 mt-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Sugerencia de Próxima Acción</span>
        <div className="text-slate-200 font-medium mb-4">{suggestedAction}</div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href={`/proposals/${opportunity.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            📄 GENERAR PROPUESTA
          </a>
          
          <a 
            href={`https://wa.me/${phoneFormatted}?text=${wsText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            💬 PREPARAR WHATSAPP
          </a>
        </div>
      </div>
      
    </div>
  );
}
