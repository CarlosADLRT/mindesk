'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Plus, Loader } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getClients } from '@/lib/api/clients'
import { getWorkspaces, createWorkspace } from '@/lib/api/workspaces'
import { CreateClientModal } from '@/components/CreateClientModal'
import type { Client, Workspace } from '@/lib/supabase'

export default function ClientsPage() {
  const { user, profile } = useAuth()
  const router = useRouter()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (user) {
      initializeWorkspace()
    }
  }, [user])

  const initializeWorkspace = async () => {
    try {
      setLoading(true)
      const workspaces = await getWorkspaces()

      if (workspaces.length > 0) {
        setWorkspace(workspaces[0])
        await loadClients(workspaces[0].id)
      } else {
        const newWorkspace = await createWorkspace({
          name: `Consultorio de ${profile?.full_name || 'Psicología'}`,
          slug: `workspace-${Date.now()}`,
        })
        setWorkspace(newWorkspace)
        setClients([])
      }
    } catch (error) {
      console.error('Error initializing workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async (workspaceId: string) => {
    try {
      const fetchedClients = await getClients(workspaceId)
      setClients(fetchedClients)
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleCreateClient = async () => {
    if (workspace) {
      await loadClients(workspace.id)
    }
  }

  const filteredClients = clients.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || (c.doc_id && c.doc_id.includes(searchTerm))
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 pb-20 max-w-5xl mx-auto">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pacientes</h1>
            <p className="text-slate-500 mt-1">
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'} en total
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white p-3 rounded-2xl hover:bg-primaryDark transition-all shadow-glow hover:shadow-lg active:scale-95"
          >
            <Plus size={24} />
          </button>
        </header>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all text-slate-900 placeholder-slate-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Empty State */}
        {clients.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay clientes aún
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando tu primer cliente
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryDark transition font-medium"
            >
              <Plus size={20} />
              Agregar Cliente
            </button>
          </div>
        )}

        {/* List */}
        {clients.length > 0 && (
          <div className="space-y-3">
            {filteredClients.map((client) => {
              const fullName = `${client.first_name} ${client.last_name}`
              return (
                <div
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="bg-white p-5 rounded-2xl border border-transparent shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-teal-100 text-primaryDark flex items-center justify-center font-bold text-lg shadow-inner">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">
                        {fullName}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {client.phone || 'Sin teléfono'} • {client.city || 'Sin ciudad'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredClients.length === 0 && clients.length > 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={24} className="opacity-50" />
                </div>
                <p className="font-medium">No se encontraron clientes.</p>
                <p className="text-sm opacity-70">Intenta con otro término de búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showCreateModal && workspace && (
        <CreateClientModal
          workspaceId={workspace.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateClient}
        />
      )}
    </>
  )
}
