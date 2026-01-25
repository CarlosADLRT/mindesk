'use client'

import { Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <SettingsIcon size={40} className="text-slate-300" />
      </div>
      <h2 className="text-xl font-bold text-slate-600">Configuración</h2>
      <p className="mt-2 text-slate-400 max-w-xs text-center">
        Personaliza tu experiencia, gestiona notificaciones y preferencias.
      </p>
      <span className="mt-8 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest">
        En Desarrollo
      </span>
    </div>
  )
}
