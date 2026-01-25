'use client'

import { Briefcase } from 'lucide-react'

export default function FinancePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Briefcase size={40} className="text-slate-300" />
      </div>
      <h2 className="text-xl font-bold text-slate-600">Módulo Financiero</h2>
      <p className="mt-2 text-slate-400 max-w-xs text-center">
        Pronto podrás gestionar facturación electrónica y reportes de ingresos.
      </p>
      <span className="mt-8 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest">
        En Desarrollo
      </span>
    </div>
  )
}
