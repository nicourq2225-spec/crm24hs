import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: {
        include: { alarmOpportunities: true }
      },
      user: true,
    }
  });

  if (!opportunity) notFound();

  const { customer, qLocation, qZones, qMobileAccess, qInstallRequired, qTargets, recommendedSolution, budgetValue, paymentMethod, installments } = opportunity;
  const alarmOpp = customer.alarmOpportunities[0];

  const targetsTxt = qTargets && qTargets.length > 0 ? qTargets.join(', ') : '';
  const needsAlarm = alarmOpp && (alarmOpp.monitoringInterest === 'Interesado' || alarmOpp.monitoringInterest === 'Quiere info');

  const formatCurrency = (val: number | null) => {
    if (val === null) return 'A definir';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white font-sans py-8 print:py-0 text-slate-800">
      
      {/* Floating Action Bar (Hidden when printing) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900 p-3 rounded-full shadow-2xl print:hidden z-50">
        <a href={`/opportunities/${opportunity.id}`} className="text-white hover:text-slate-300 font-medium px-4 text-sm whitespace-nowrap">
          ← Volver
        </a>
        <button 
          onClick="window.print()" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          🖨️ Imprimir / PDF
        </button>
      </div>

      {/* A4 Document Container */}
      <div className="max-w-[21cm] mx-auto bg-white min-h-[29.7cm] shadow-xl print:shadow-none p-8 md:p-12 relative overflow-hidden">
        
        {/* Header styling */}
        <div className="absolute top-0 left-0 w-full h-3 bg-blue-700"></div>

        {/* HEADER */}
        <header className="flex justify-between items-start mb-12 border-b-2 border-slate-100 pb-6 mt-4">
          <div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tight">PROPUESTA COMERCIAL</h1>
            <p className="text-slate-500 font-medium mt-1">Sistemas de Seguridad y Videovigilancia</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold text-slate-800">{format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
            <p className="text-slate-500 mt-1">Ref: {opportunity.id.slice(-6).toUpperCase()}</p>
          </div>
        </header>

        {/* CLIENT DETAILS */}
        <section className="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Preparado para</p>
              <p className="text-lg font-bold text-slate-800">{customer.name}</p>
              <p className="text-slate-600">{customer.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Asesor Comercial</p>
              <p className="text-lg font-bold text-slate-800">{opportunity.user.name}</p>
              <p className="text-slate-600">Stand Nuevo Centro Shopping</p>
            </div>
          </div>
        </section>

        {/* NEEDS ANALYSIS */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. Análisis de Necesidad</h2>
          <p className="text-slate-700 leading-relaxed">
            De acuerdo a nuestro relevamiento, hemos diseñado esta propuesta para proteger <strong>{qLocation || 'su propiedad'}</strong>. 
            El objetivo principal es asegurar {targetsTxt ? `el control de ${targetsTxt}` : 'las zonas críticas'} mediante un sistema de videovigilancia
            {qZones ? ` compuesto por aproximadamente ${qZones} zonas de visualización` : ''}.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {qMobileAccess === 'Sí' && <span className="bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-100">📱 Visualización Remota APP</span>}
            {qInstallRequired === 'Equipo + instalación' && <span className="bg-slate-100 text-slate-800 text-sm font-medium px-3 py-1 rounded-full border border-slate-200">🔧 Instalación Profesional Incluida</span>}
          </div>
        </section>

        {/* SOLUTION */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Solución Recomendada</h2>
          
          <div className="bg-blue-600 print:bg-blue-50 text-white print:text-blue-900 p-6 rounded-2xl shadow-md mb-6 print:border print:border-blue-200">
            <h3 className="text-2xl font-black">{recommendedSolution || opportunity.productInterest}</h3>
            <p className="mt-2 text-blue-100 print:text-blue-800 font-medium">Equipamiento oficial diseñado específicamente para tu necesidad.</p>
          </div>

          {opportunity.proposalProducts && (
            <div className="mb-6 bg-slate-50 border border-slate-200 p-5 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Detalle del Equipamiento</h4>
              <div className="text-slate-700 whitespace-pre-line text-sm leading-relaxed">
                {opportunity.proposalProducts}
              </div>
            </div>
          )}

          {opportunity.proposalBenefits && (
            <div className="mb-6 bg-green-50 border border-green-200 p-5 rounded-xl">
              <h4 className="font-bold text-green-800 mb-2 text-sm uppercase tracking-wider">Beneficios Incluidos</h4>
              <div className="text-green-900 whitespace-pre-line text-sm leading-relaxed font-medium">
                {opportunity.proposalBenefits}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="text-2xl mt-1">📹</div>
              <div>
                <h4 className="font-bold text-slate-800">Equipamiento de Videovigilancia</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Cámaras de alta definición con visión nocturna, detección inteligente y alerta al celular. Diseño resistente y estético.</p>
              </div>
            </div>
            
            {qInstallRequired === 'Equipo + instalación' && (
              <div className="flex gap-4 items-start">
                <div className="text-2xl mt-1">🛠️</div>
                <div>
                  <h4 className="font-bold text-slate-800">Servicio de Instalación Integral</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">Mano de obra especializada, configuración en dispositivos móviles, provisión de materiales menores y puesta en marcha del sistema.</p>
                </div>
              </div>
            )}

            {needsAlarm && (
              <div className="flex gap-4 items-start">
                <div className="text-2xl mt-1">🚨</div>
                <div>
                  <h4 className="font-bold text-slate-800">Módulo de Alarma Monitoreada (Opcional)</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">De acuerdo a tu interés, te proponemos complementar las cámaras con un sistema de alarma monitoreada 24hs para reacción inmediata ante intrusiones.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INVESTMENT */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Inversión Estimada</h2>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-slate-600">Total Presupuestado</span>
              <span className="text-3xl font-black text-slate-900">{formatCurrency(budgetValue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-200 pt-3 mt-3">
              <span>Condición de pago:</span>
              <span className="font-bold text-slate-700">{paymentMethod || 'A coordinar'} {installments ? `(${installments} cuotas)` : ''}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            * Los valores expresados son estimados y están sujetos a verificación técnica en el domicilio si corresponde instalación. 
            Válido por 7 días.
          </p>
        </section>

        {/* NEXT STEPS */}
        <section className="bg-slate-900 print:bg-slate-50 text-white print:text-slate-900 p-8 rounded-2xl text-center print:border print:border-slate-200">
          <h2 className="text-xl font-bold mb-3">¿Cómo avanzamos?</h2>
          <p className="text-slate-300 print:text-slate-700 font-medium mb-6 max-w-md mx-auto">
            Si la propuesta se adapta a lo que buscás, contactate con tu asesor para confirmar los equipos o coordinar la visita técnica.
          </p>
          <div className="inline-block bg-white print:bg-slate-200 text-slate-900 px-6 py-3 rounded-full font-black">
            Contactar: {opportunity.user.phone || 'Stand Nuevo Centro Shopping'}
          </div>
        </section>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // To handle print button
              document.addEventListener('click', function(e) {
                if (e.target.closest('button') && e.target.closest('button').innerText.includes('Imprimir')) {
                  window.print();
                }
              });
            `,
          }}
        />
      </div>
    </div>
  );
}
