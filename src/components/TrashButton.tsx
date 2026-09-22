'use client';

export function TrashButton() {
  return (
    <button 
      type="submit" 
      onClick={(e) => {
        if (!confirm('¿Estás seguro de que quieres enviar esta oportunidad a la papelera?')) {
          e.preventDefault();
        }
      }}
      className="text-slate-400 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs flex items-center transition-colors font-medium"
    >
      🗑️ Enviar a papelera
    </button>
  );
}
